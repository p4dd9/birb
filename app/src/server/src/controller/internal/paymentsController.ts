import { serverLogger } from '@birb/shared'
import { context } from '@devvit/web/server'
import { Router } from 'express'
import { fulfillLivesOrder, handleLivesRefund, type PurchaseOrder } from '../../service/livesPurchaseService'
import { trackPurchase } from '../../service/redditcoreService'

export const paymentsController = Router()

type Order = { id?: string; status?: string; products?: { sku: string; metadata?: { category?: string } }[] }

const readOrder = (body: unknown): Order => {
	const b = (body ?? {}) as Record<string, unknown>
	return (b.order ?? b) as Order
}

// Fulfillment: grant lives from order products.
paymentsController.post('/fulfill', async (req, res) => {
	try {
		const order = readOrder(req.body) as PurchaseOrder
		serverLogger.info(`Fulfilling order ${order.id}: ${(order.products ?? []).map((p) => p.sku).join(', ')}`)

		if (order.status && order.status !== 'PAID') {
			res.status(400).json({ success: false, error: 'Order not paid' })
			return
		}

		if (!context.userId) {
			res.status(200).json({ success: true })
			return
		}

		const livesResult = await fulfillLivesOrder(order)

		if (!livesResult.applied) {
			res.status(200).json({ success: true, skipped: livesResult.reason })
			return
		}

		trackPurchase(order, { grantedLives: String(livesResult.grantedLives) }).catch((error) => {
			serverLogger.warn(`Error tracking purchase for order ${order.id}: ${error}`)
		})

		res.status(200).json({ success: true, grantedLives: livesResult.grantedLives })
	} catch (error) {
		serverLogger.error(`Payments fulfill failed: ${error}`)
		res.status(500).json({ success: false, error: String(error) })
	}
})

// Refund: lives purchases are instant and not clawed back here.
paymentsController.post('/refund', async (req, res) => {
	try {
		const order = readOrder(req.body) as PurchaseOrder
		serverLogger.info(`Refunding order ${order.id}`)
		await handleLivesRefund(order)
		res.status(200).json({ success: true })
	} catch (error) {
		serverLogger.error(`Payments refund failed: ${error}`)
		res.status(500).json({ success: false, error: String(error) })
	}
})
