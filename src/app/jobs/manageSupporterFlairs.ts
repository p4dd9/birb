import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'
import { purchaseKey, thirtyDaysInMillis } from '../services/purchaseService'

const isPurchaseOlderThan30Days = (purchaseDate: string) => {
	const purchaseTime = parseInt(purchaseDate, 10)
	const currentTime = Date.now()
	return currentTime - purchaseTime > thirtyDaysInMillis
}

export const convertMillisToDate = (timeInMillis: string): string => {
	const date = new Date(parseInt(timeInMillis))
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	})
}

export const convertMillisToDateShort = (timeInMillis: string): string => {
	const date = new Date(parseInt(timeInMillis))
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

export const manageSupporterFlairs = Devvit.addSchedulerJob({
	name: 'MANAGE_SUPPORTER_FLAIRS',
	onRun: async (_event, context) => {
		const scanResult = await context.redis.hScan(purchaseKey, 0)

		devvitLogger.info(`Checking cursor: "${scanResult.cursor}", "${scanResult.fieldValues.length}"`)

		for (const { field: userId, value: purchaseDateInMillis } of scanResult.fieldValues) {
			try {
				devvitLogger.info(
					`User ${userId} has an active purchase. Runs out at ${convertMillisToDate(purchaseDateInMillis)}.`
				)

				if (isPurchaseOlderThan30Days(purchaseDateInMillis)) {
					const [user, subreddit] = await Promise.all([
						context.reddit.getUserById(userId),
						context.reddit.getCurrentSubredditName(),
					])

					if (!user) {
						return
					}

					try {
						devvitLogger.info(
							`Removing supporter flair and supporter purchase from user ${user.username}. Expired on ${convertMillisToDate(purchaseDateInMillis)}.`
						)

						await Promise.all([
							context.reddit.removeUserFlair(subreddit, user.username),
							context.redis.hDel(purchaseKey, [userId]),
						])
					} catch (e) {
						devvitLogger.error(`Error remove userflair for user ${user.username} in ${subreddit}: ${e}`)
					}
				}
			} catch (e) {
				devvitLogger.error('Error checking on user for flair.')
			}
		}
	},
})
