import type { AppData, LatestDailyUrlResponse, SubscribeResponse } from '@birb/shared'
import { configFromSeed, serverLogger, subscribedKey, toDateKey } from '@birb/shared'
import { context, redis } from '@devvit/web/server'
import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { getCommunityStats, touchOnlinePlayers } from '../service/communityService'
import { getDailyDateKey, getDailyLeaderboard, getDailySeed, getLatestDailyNumber, getLatestDailyPostUrl, getYouStats } from '../service/dailyService'
import { syncPlayerLives } from '../service/livesService'
import { getIapData } from '../service/purchaseService'

export const appController = Router()

// GET /api/v1/app/data?dailyNumber=N — everything the client UI needs.
appController.get('/data', requireAuth, async (req, res) => {
	try {
		const userId = context.userId!
		const parsed = typeof req.query.dailyNumber === 'string' ? Number(req.query.dailyNumber) : NaN
		const latestDailyNumber = await getLatestDailyNumber()
		const dailyNumber = Number.isFinite(parsed) && parsed > 0 ? parsed : latestDailyNumber

		if (dailyNumber === 0) {
			const lives = await syncPlayerLives(userId)
			const empty: AppData = {
				config: configFromSeed(0),
				name: context.subredditName ?? 'BIRB',
				dateKey: toDateKey(),
				dailyNumber: 0,
				latestDailyNumber: 0,
				latestDailyPostUrl: null,
				you: { highscore: 0, attempts: 0, taps: 0, rank: null },
				online: 0,
				leaderboard: [],
				stats: { communityScore: 0, communityAttempts: 0, communityPlayers: 0 },
				iap: { membershipActiveUntil: null },
				lives,
				subscribed: false,
			}
			res.json(empty)
			return
		}

		const [seed, you, online, leaderboard, stats, iap, subscribedFlag, storedDateKey, latestDailyPostUrl, lives] =
			await Promise.all([
			getDailySeed(dailyNumber),
			getYouStats(userId, dailyNumber),
			touchOnlinePlayers(userId),
			getDailyLeaderboard(dailyNumber),
			getCommunityStats(),
			getIapData(userId),
			redis.get(subscribedKey(userId)),
			getDailyDateKey(dailyNumber),
			getLatestDailyPostUrl(),
			syncPlayerLives(userId),
		])

		const appData: AppData = {
			config: configFromSeed(seed),
			name: context.subredditName ?? 'BIRB',
			dateKey: storedDateKey ?? toDateKey(),
			dailyNumber,
			latestDailyNumber,
			latestDailyPostUrl,
			you,
			online,
			leaderboard,
			stats,
			iap,
			lives,
			subscribed: subscribedFlag === 'true',
		}
		res.json(appData)
	} catch (error) {
		serverLogger.error(`GET /app/data failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})

// GET /api/v1/app/latest-daily-url — resolve the active daily post URL for navigateTo.
appController.get('/latest-daily-url', requireAuth, async (_req, res) => {
	try {
		const url = await getLatestDailyPostUrl()
		const body: LatestDailyUrlResponse = { url }
		res.json(body)
	} catch (error) {
		serverLogger.error(`GET /app/latest-daily-url failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})

// POST /api/v1/app/subscribe — record that the user opted in.
appController.post('/subscribe', requireAuth, async (_req, res) => {
	try {
		const userId = context.userId!
		await redis.set(subscribedKey(userId), 'true')
		const body: SubscribeResponse = { subscribed: true }
		res.json(body)
	} catch (error) {
		serverLogger.error(`POST /app/subscribe failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})
