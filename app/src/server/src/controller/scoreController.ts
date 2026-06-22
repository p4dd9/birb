import type { SaveScoreRequest, ShareScoreCommentRequest } from '@birb/shared'
import { dailySeedKey, serverLogger } from '@birb/shared'
import { context, redis } from '@devvit/web/server'
import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { shareScoreComment } from '../service/commentService'
import { getLatestDailyNumber, saveDailyScore } from '../service/dailyService'
import { consumePlayerLife } from '../service/livesService'

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
		const lives = await consumePlayerLife(userId)
		res.json({ ...result, lives })
	} catch (error) {
		serverLogger.error(`POST /score failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})

// POST /api/v1/score/share — comment the player's score on the current post.
scoreController.post('/share', requireAuth, async (req, res) => {
	try {
		const { comment, score, taps } = (req.body ?? {}) as Partial<ShareScoreCommentRequest>

		if (typeof comment !== 'string' || typeof score !== 'number' || typeof taps !== 'number') {
			res.status(400).json({ error: 'comment, score and taps are required' })
			return
		}

		await shareScoreComment(
			comment,
			Math.max(0, Math.floor(score)),
			Math.max(0, Math.floor(taps))
		)
		res.json({ ok: true })
	} catch (error) {
		serverLogger.error(`POST /score/share failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})
