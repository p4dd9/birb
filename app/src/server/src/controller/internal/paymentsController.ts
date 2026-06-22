import { serverLogger } from '@birb/shared'
import { context, reddit } from '@devvit/web/server'
import { Router } from 'express'
import { fulfillLivesOrder, handleLivesRefund, type PurchaseOrder } from '../../service/livesPurchaseService'
import { grantMembership, revokeMembership } from '../../service/purchaseService'

export const paymentsController = Router()

type OrderProduct = { sku: string; metadata?: { category?: string } }
type Order = { id?: string; status?: string; products?: OrderProduct[] }

const readOrder = (body: unknown): Order => {
	const b = (body ?? {}) as Record<string, unknown>
	return (b.order ?? b) as Order
}

// Fulfillment: grant flair or lives depending on product category.
paymentsController.post('/fulfill', async (req, res) => {
	try {
		const order = readOrder(req.body) as PurchaseOrder
		serverLogger.info(`Fulfilling order ${order.id}: ${(order.products ?? []).map((p) => p.sku).join(', ')}`)

		if (order.status && order.status !== 'PAID') {
			res.status(400).json({ success: false, error: 'Order not paid' })
			return
		}

		const userId = context.userId
		if (!userId) {
			res.status(200).json({ success: true })
			return
		}

		const user = await reddit.getUserById(userId)
		const subredditName = context.subredditName
		const flairProduct = (order.products ?? []).find((p) => p.metadata?.category === 'flair')
		const livesResult = await fulfillLivesOrder(order)

		if (flairProduct && user?.username && subredditName) {
			await grantMembership(subredditName, user.username, user.id, flairProduct.sku)
		}

		if (!flairProduct && !livesResult.applied) {
			res.status(200).json({ success: true, skipped: livesResult.reason })
			return
		}

		res.status(200).json({ success: true, grantedLives: livesResult.grantedLives })
	} catch (error) {
		serverLogger.error(`Payments fulfill failed: ${error}`)
		res.status(500).json({ success: false, error: String(error) })
	}
})

// Refund: remove flair; lives purchases are instant and not clawed back here.
paymentsController.post('/refund', async (req, res) => {
	try {
		const order = readOrder(req.body) as PurchaseOrder
		serverLogger.info(`Refunding order ${order.id}`)

		const userId = context.userId
		const flairProduct = (order.products ?? []).find((p) => p.metadata?.category === 'flair')
		await handleLivesRefund(order)

		if (!userId || !flairProduct) {
			res.status(200).json({ success: true })
			return
		}

		const user = await reddit.getUserById(userId)
		const subredditName = context.subredditName
		if (user?.username && subredditName) {
			await revokeMembership(subredditName, user.username)
		}

		res.status(200).json({ success: true })
	} catch (error) {
		serverLogger.error(`Payments refund failed: ${error}`)
		res.status(500).json({ success: false, error: String(error) })
	}
})
