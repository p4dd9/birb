import { isLivesProductSku, livesBySku, serverLogger } from '@birb/shared'
import { processedOrderKey } from '@birb/shared/keys'
import { context, redis } from '@devvit/web/server'
import { addPlayerLives } from './livesService'

const PROCESSED_ORDER_TTL_SECONDS = 90 * 24 * 60 * 60

type PurchaseProduct = {
	sku: string
	price?: number
	metadata?: { category?: string }
}

export type PurchaseOrder = {
	id?: string
	status?: string
	products?: PurchaseProduct[]
	userId?: string
	username?: string
}

const resolveOrderUserId = (order: PurchaseOrder): string | null => {
	const fromOrder = typeof order.userId === 'string' && order.userId.length > 0 ? order.userId : null
	return context.userId ?? fromOrder
}

export const fulfillLivesOrder = async (
	order: PurchaseOrder
): Promise<{ applied: boolean; grantedLives: number; reason?: string }> => {
	if (!order.id) {
		return { applied: false, grantedLives: 0, reason: 'Missing order id' }
	}

	if (order.status && order.status !== 'PAID') {
		return { applied: false, grantedLives: 0, reason: 'Order not paid' }
	}

	const lockKey = processedOrderKey(order.id)
	const alreadyProcessed = await redis.get(lockKey)
	if (alreadyProcessed) {
		return { applied: false, grantedLives: 0, reason: 'Order already processed' }
	}

	const userId = resolveOrderUserId(order)
	if (!userId) {
		return { applied: false, grantedLives: 0, reason: 'Missing user id' }
	}

	let grantedLives = 0
	for (const product of order.products ?? []) {
		if (!isLivesProductSku(product.sku)) continue
		grantedLives += livesBySku.get(product.sku) ?? 0
	}

	if (grantedLives <= 0) {
		return { applied: false, grantedLives: 0, reason: 'No lives products in order' }
	}

	await addPlayerLives(userId, grantedLives)
	await redis.set(lockKey, '1')
	await redis.expire(lockKey, PROCESSED_ORDER_TTL_SECONDS)

	serverLogger.info(`Fulfilled lives order ${order.id} for ${userId}: +${grantedLives} lives`)
	return { applied: true, grantedLives }
}

export const handleLivesRefund = async (order: PurchaseOrder): Promise<void> => {
	serverLogger.info(`Lives refund received for order ${order.id ?? 'unknown'}`)
}
