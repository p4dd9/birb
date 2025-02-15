// note: devvit staff says its AWLWAYS "PAID" status here.

import { addPaymentHandler, type Order } from '@devvit/payments'
import type { Context } from '@devvit/public-api'
import { devvitLogger } from './shared/logger'

// note: throw gives user feedback on why it failed.
addPaymentHandler({
	fulfillOrder: async (order: Order, context: Context) => {
		devvitLogger.info(order.products.map(({ sku }) => sku).join(', '))

		if (order.status !== 'PAID') {
			throw new Error('You did not pay for your purchase. Please try again.')
		}
		if (!context.userId) {
			return
		}
		const [user, subredditName] = await Promise.all([
			context.reddit.getUserById(context.userId),
			context.reddit.getCurrentSubredditName(),
		])

		order.products.map(async (productOrder) => {
			const { metadata, sku } = productOrder
			if (metadata.category === 'flair') {
				if (!subredditName || !user?.username) {
					return
				}

				try {
					context.scheduler.runJob({
						name: 'SET_FLAIR',
						data: {
							userid: user.id,
							username: user.username,
							subredditname: subredditName,
							sku,
						},
						runAt: new Date(),
					})
				} catch (error) {
					if (!subredditName || !user?.username) {
						return
					}
					await context.reddit.removeUserFlair(subredditName, user.username)
					throw new Error(
						`Your purchase was not successful. Please try again. No Gold was deducted. ${error}`
					)
				}
			}
		})
	},

	refundOrder: async (order: Order, context: Context) => {
		devvitLogger.info(`Trying to refund order ${order.id}, ${order.products.map(({ sku }) => sku).join(', ')}.`)

		const flairProducts = order.products.find(({ metadata }) => metadata.category === 'flair')
		if (!context.userId) {
			return
		}
		const [user, subreddit] = await Promise.all([
			context.reddit.getUserById(context.userId),
			context.reddit.getSubredditInfoById(context.subredditId),
		])

		if (flairProducts) {
			try {
				if (!subreddit?.name || !user?.username) {
					return
				}
				await context.reddit.removeUserFlair(subreddit.name, user.username)
				devvitLogger.info(`Removed flair from user ${user.username} in subreddit ${subreddit.name}`)
			} catch (error) {
				devvitLogger.error(
					`Error refund ${flairProducts.sku} flair for user ${user?.username} ${user?.id}: ${error}`
				)
			}
		}
	},
})
