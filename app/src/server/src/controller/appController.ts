import type { AppData, AudioPrefResponse, LatestDailyUrlResponse, PushOptInResponse, SubscribeResponse } from '@birb/shared'
import { audioMutedKey, configFromSeed, pushOptInKey, serverLogger, shareRewardKey, subscribedKey, toDateKey } from '@birb/shared'
import { context, notifications, reddit, redis } from '@devvit/web/server'
import { Router } from 'express'
import { requireAuth } from '../middleware/requireAuth'
import { getCommunityStats, touchOnlinePlayers } from '../service/communityService'
import { getDailyDateKey, getDailyLeaderboard, getDailySeed, getLatestDailyNumber, getLatestDailyPostUrl, getYouStats } from '../service/dailyService'
import { getJoinRewardState } from '../service/joinRewardService'
import { syncPlayerLives } from '../service/livesService'

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
				lives,
				subscribed: false,
				pushNotifications: false,
				audioMuted: true,
				joinReward: { promptTier: null, claimed: false },
				shareRewardClaimed: false,
			}
			res.json(empty)
			return
		}

		const [
			seed,
			you,
			online,
			leaderboard,
			stats,
			subscribedFlag,
			pushOptInFlag,
			audioMutedFlag,
			joinReward,
			storedDateKey,
			latestDailyPostUrl,
			lives,
			shareRewardFlag,
		] = await Promise.all([
			getDailySeed(dailyNumber),
			getYouStats(userId, dailyNumber),
			touchOnlinePlayers(userId),
			getDailyLeaderboard(dailyNumber),
			getCommunityStats(),
			redis.get(subscribedKey(userId)),
			redis.get(pushOptInKey(userId)),
			redis.get(audioMutedKey(userId)),
			getJoinRewardState(userId),
			getDailyDateKey(dailyNumber),
			getLatestDailyPostUrl(),
			syncPlayerLives(userId),
			redis.get(shareRewardKey(dailyNumber, userId)),
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
			lives,
			subscribed: subscribedFlag === 'true',
			pushNotifications: pushOptInFlag === 'true',
			audioMuted: audioMutedFlag === null ? true : audioMutedFlag === 'true',
			joinReward,
			shareRewardClaimed: Boolean(shareRewardFlag),
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

// POST /api/v1/app/subscribe — subscribe the user to the subreddit and mirror the flag.
appController.post('/subscribe', requireAuth, async (_req, res) => {
	try {
		const userId = context.userId!
		await reddit.subscribeToCurrentSubreddit()
		await redis.set(subscribedKey(userId), 'true')
		const body: SubscribeResponse = { subscribed: true }
		res.json(body)
	} catch (error) {
		serverLogger.error(`POST /app/subscribe failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})

// POST /api/v1/app/unsubscribe — unsubscribe the user and clear the flag.
appController.post('/unsubscribe', requireAuth, async (_req, res) => {
	try {
		const userId = context.userId!
		await reddit.unsubscribeFromCurrentSubreddit()
		await redis.del(subscribedKey(userId))
		const body: SubscribeResponse = { subscribed: false }
		res.json(body)
	} catch (error) {
		serverLogger.error(`POST /app/unsubscribe failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})

// POST /api/v1/app/push/opt-in — opt the user in to push notifications.
appController.post('/push/opt-in', requireAuth, async (_req, res) => {
	try {
		const userId = context.userId!
		await notifications.optInCurrentUser()
		await redis.set(pushOptInKey(userId), 'true')
		const body: PushOptInResponse = { pushNotifications: true }
		res.json(body)
	} catch (error) {
		serverLogger.error(`POST /app/push/opt-in failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})

// POST /api/v1/app/push/opt-out — opt the user out of push notifications.
appController.post('/push/opt-out', requireAuth, async (_req, res) => {
	try {
		const userId = context.userId!
		await notifications.optOutCurrentUser()
		await redis.del(pushOptInKey(userId))
		const body: PushOptInResponse = { pushNotifications: false }
		res.json(body)
	} catch (error) {
		serverLogger.error(`POST /app/push/opt-out failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})

// POST /api/v1/app/audio — persist the user's audio mute preference.
appController.post('/audio', requireAuth, async (req, res) => {
	try {
		const userId = context.userId!
		const muted = Boolean((req.body ?? {}).muted)
		await redis.set(audioMutedKey(userId), String(muted))
		const body: AudioPrefResponse = { muted }
		res.json(body)
	} catch (error) {
		serverLogger.error(`POST /app/audio failed: ${error}`)
		res.status(500).json({ error: String(error) })
	}
})
