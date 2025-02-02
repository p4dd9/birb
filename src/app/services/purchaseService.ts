import type { JobContext } from '@devvit/public-api'

export const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000
export const purchaseKey = 'user_purchases'

export const storePurchase = async (context: JobContext, userId: string) => {
	await context.redis.hSet(purchaseKey, { [userId]: Date.now().toString() })
}
