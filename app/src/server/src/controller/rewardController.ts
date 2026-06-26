import type { ClaimJoinRewardResponse } from '@birb/shared'
import { serverLogger } from '@birb/shared'
import { context } from '@devvit/web/server'
import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { claimJoinReward, markJoinRewardSeen } from '../service/joinRewardService'

export const rewardController = Router()

// POST /api/v1/reward/join/seen — mark the join prompt as shown at a tier.
rewardController.post('/join/seen', requireAuth, async (req, res) => {
	try {
		const userId = context.userId!
		const tier = Number((req.body ?? {}).tier)
		if (!Number.isFinite(tier) || tier <= 0) {
			res.status(400).json({ error: 'tier is required' })
			return
		}

		await markJoinRewardSeen(userId, Math.floor(tier))
		res.json({ ok: true })
	} catch (error) {
		serverLogger.error(`POST /reward/join/seen failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})

// POST /api/v1/reward/join/claim — accept the join reward (subscribe + push + 100 lives).
rewardController.post('/join/claim', requireAuth, async (_req, res) => {
	try {
		const userId = context.userId!
		const result = await claimJoinReward(userId)
		const body: ClaimJoinRewardResponse = result
		res.json(body)
	} catch (error) {
		serverLogger.error(`POST /reward/join/claim failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})
