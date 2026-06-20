import type { AppIAP } from '@birb/shared'
import { PURCHASE_KEY, serverLogger, THIRTY_DAYS_MS } from '@birb/shared'
import { context, reddit, redis } from '@devvit/web/server'

const dateShort = (millis: number): string =>
	new Date(millis).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const dateLong = (millis: number): string =>
	new Date(millis).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})

/** Record a fresh purchase timestamp for a user. */
export const storePurchase = async (userId: string) => {
	await redis.hSet(PURCHASE_KEY, { [userId]: Date.now().toString() })
}

/** Membership status for the calling user, surfaced in AppData. */
export const getIapData = async (userId: string): Promise<AppIAP> => {
	const purchase = await redis.hGet(PURCHASE_KEY, userId)
	if (!purchase) return { membershipActiveUntil: null }
	const activeUntil = parseInt(purchase, 10) + THIRTY_DAYS_MS
	return { membershipActiveUntil: dateShort(activeUntil) }
}

/** Grant the Birb Club Member flair and record the purchase (payment fulfillment). */
export const grantMembership = async (subredditName: string, username: string, userId: string, sku: string) => {
	serverLogger.info(`Setting Birb Club flair for ${username} (sku ${sku}).`)
	await Promise.all([
		storePurchase(userId),
		reddit.setUserFlair({
			subredditName,
			username,
			backgroundColor: '#FE9A14',
			text: 'Birb Club Member',
			textColor: 'dark',
		}),
	])
}

/** Remove the Birb Club Member flair (payment refund). */
export const revokeMembership = async (subredditName: string, username: string) => {
	await reddit.removeUserFlair(subredditName, username)
	serverLogger.info(`Removed Birb Club flair from ${username} in ${subredditName}.`)
}

/**
 * Daily sweep: remove membership flair + purchase record for anyone whose
 * 30-day window has elapsed. (Replaces the MANAGE_MEMBERSHIP_FLAIRS job.)
 */
export const sweepExpiredMemberships = async (): Promise<{ checked: number; expired: number }> => {
	let checked = 0
	let expired = 0
	const now = Date.now()
	let cursor = 0

	do {
		const scan = await redis.hScan(PURCHASE_KEY, cursor)
		cursor = scan.cursor

		for (const { field: userId, value: purchasedAt } of scan.fieldValues) {
			checked += 1
			const purchasedMillis = parseInt(purchasedAt, 10)
			if (now - purchasedMillis <= THIRTY_DAYS_MS) continue

			try {
				const user = await reddit.getUserById(userId as `t2_${string}`)
				const subredditName = context.subredditName
				if (!user || !subredditName) continue

				serverLogger.info(`Membership expired for ${user.username} (since ${dateLong(purchasedMillis)}).`)
				await Promise.all([reddit.removeUserFlair(subredditName, user.username), redis.hDel(PURCHASE_KEY, [userId])])
				expired += 1
			} catch (e) {
				serverLogger.error(`Error sweeping membership for ${userId}: ${e}`)
			}
		}
	} while (cursor !== 0)

	return { checked, expired }
}
