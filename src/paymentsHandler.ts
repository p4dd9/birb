// note: devvit staff says its AWLWAYS "PAID" status here.

import { addPaymentHandler, type Order } from '@devvit/payments'
import type { Context } from '@devvit/public-api'
import { devvitLogger } from './shared/logger'

addPaymentHandler({
	fulfillOrder: async (order: Order, context: Context) => {
		devvitLogger.info(order.products.map(({ sku }) => sku).join(', '))

		if (order.status !== 'PAID') {
			throw new Error('You did not pay for your purchase. Please try again.')
		}
		if (!context.userId) {
			return
		}
	},

	refundOrder: async (order: Order, context: Context) => {
		devvitLogger.info(`Trying to refund order ${order.id}, ${order.products.map(({ sku }) => sku).join(', ')}.`)
		if (!context.userId) {
			return
		}
	},
})
