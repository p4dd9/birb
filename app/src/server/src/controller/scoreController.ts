import type { SaveScoreRequest } from '@birb/shared'
import { dailySeedKey, serverLogger } from '@birb/shared'
import { context, redis } from '@devvit/web/server'
import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { getLatestDailyNumber, saveDailyScore } from '../service/dailyService'

export const scoreController = Router()

// POST /api/v1/score — persist a finished run for the current daily only.
scoreController.post('/', requireAuth, async (req, res) => {
	try {
		const userId = context.userId!
		const username = context.username!
		const { dailyNumber, score, taps } = (req.body ?? {}) as Partial<SaveScoreRequest>

		if (typeof dailyNumber !== 'number' || typeof score !== 'number' || typeof taps !== 'number') {
			res.status(400).json({ error: 'dailyNumber, score and taps are required' })
			return
		}

		const latestDailyNumber = await getLatestDailyNumber()
		if (dailyNumber !== latestDailyNumber) {
			res.status(403).json({ error: `Daily #${dailyNumber} is no longer playable` })
			return
		}

		const known = await redis.get(dailySeedKey(dailyNumber))
		if (!known) {
			res.status(404).json({ error: `Unknown daily #${dailyNumber}` })
			return
		}

		const result = await saveDailyScore(
			userId,
			username,
			dailyNumber,
			Math.max(0, Math.floor(score)),
			Math.max(0, Math.floor(taps))
		)
		res.json(result)
	} catch (error) {
		serverLogger.error(`POST /score failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})
