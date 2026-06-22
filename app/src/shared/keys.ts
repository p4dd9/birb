/**
 * Redis key builders and daily/seed helpers shared by client and server.
 * Community keys are carried over verbatim from the legacy app so existing
 * data keeps working.
 */

import type { AppConfiguration, BirbPostData } from './messages'

/* ----------------------------- community ----------------------------- */

export const communityHighscoresKey = (subredditId: string) => `community:${subredditId}:highscores`
export const communityAttemptsKey = (subredditId: string) => `community:${subredditId}:attempts`
export const communityScoreKey = (subredditId: string) => `community:${subredditId}:score`

/* ------------------------------- daily ------------------------------- */

/** Monotonic counter — each new daily gets the next number (#1, #2, …). */
export const DAILY_COUNTER_KEY = 'daily:counter'

/** Sorted set of all created dailies: member = dailyNumber, score = createdAtMs. */
export const DAILY_INDEX_KEY = 'daily:index'

/** Reddit URL of the most recently created daily post (for navigateTo from archived dailies). */
export const DAILY_LATEST_POST_URL_KEY = 'daily:latest:postUrl'

/** Daily number that `DAILY_LATEST_POST_URL_KEY` points at — guards against stale cache. */
export const DAILY_LATEST_NUMBER_KEY = 'daily:latest:number'

export const dailyPostIdKey = (dailyNumber: number) => `daily:${dailyNumber}:postId`
export const dailyPostUrlKey = (dailyNumber: number) => `daily:${dailyNumber}:postUrl`

/** Set when a closed-daily sticky wrap-up comment has been posted (value = comment id). */
export const dailyClosedCommentKey = (dailyNumber: number) => `daily:${dailyNumber}:closedCommentId`

/** Set when a new-daily sticky intro comment has been posted (value = comment id). */
export const dailyIntroCommentKey = (dailyNumber: number) => `daily:${dailyNumber}:introCommentId`

export const dailySeedKey = (dailyNumber: number) => `daily:${dailyNumber}:seed`
export const dailyDateKey = (dailyNumber: number) => `daily:${dailyNumber}:dateKey`
export const dailyScoresKey = (dailyNumber: number) => `daily:${dailyNumber}:scores`
export const dailyAttemptsKey = (dailyNumber: number) => `daily:${dailyNumber}:attempts`
export const dailyTapsKey = (dailyNumber: number) => `daily:${dailyNumber}:taps`

/* ------------------------------- misc -------------------------------- */

export const ACTIVE_PLAYERS_HASH = 'active_players'
export const ACTIVE_PLAYER_TTL = 30 * 1000

export const subscribedKey = (userId: string) => `subscribed:${userId}`

/** Per-player lives pool (hash: count, lastRefillAt). */
export const playerLivesKey = (userId: string) => `player:${userId}:lives`

/** Idempotency lock for fulfilled payment orders. */
export const processedOrderKey = (orderId: string) => `payment:order:processed:${orderId}`

/* --------------------------- date & seed ----------------------------- */

/** UTC day key, formatted YYYY-MM-DD. */
export const toDateKey = (date: Date = new Date()): string => date.toISOString().slice(0, 10)

/**
 * Deterministic 32-bit seed derived from a dateKey (xfnv1a). Same day always
 * yields the same seed, so a daily level is reproducible without storage.
 */
export const seedFromDateKey = (dateKey: string): number => {
	let h = 2166136261 >>> 0
	for (let i = 0; i < dateKey.length; i++) {
		h = Math.imul(h ^ dateKey.charCodeAt(i), 16777619)
	}
	// finalize
	h += h << 13
	h ^= h >>> 7
	h += h << 3
	h ^= h >>> 17
	h += h << 5
	return h >>> 0
}

/* ------------------------- seed-based cosmetics ---------------------- */

export const WORLD_IDS = ['sunset', 'daylight', 'evening', 'night', 'midnight'] as const
export type WorldId = (typeof WORLD_IDS)[number]

export const PLAYER_FRAME_COUNT = 7
export const PIPE_FRAME_COUNT = 8

/** Deterministic world / birb / pipe picks for a daily seed. */
export const configFromSeed = (seed: number) => ({
	world: WORLD_IDS[seed % WORLD_IDS.length]!,
	playerFrame: (seed >>> 8) % PLAYER_FRAME_COUNT,
	pipeFrame: (seed >>> 16) % PIPE_FRAME_COUNT,
})

/** Deterministic seed for a numbered daily level. */
export const seedFromDailyNumber = (dailyNumber: number): number => seedFromDateKey(String(dailyNumber))

/** Prefer postData seed, otherwise derive from the daily number. */
export const resolveDailySeed = (dailyNumber: number, postSeed?: number): number =>
	postSeed ?? seedFromDailyNumber(dailyNumber)

/** Resolve cosmetics from baked postData (instant) or derive from seed / daily number. */
export const resolveConfigFromPostData = (
	postData?: Pick<BirbPostData, 'config' | 'seed' | 'dailyNumber'>,
): AppConfiguration | undefined => {
	if (postData?.config) return postData.config
	if (postData?.seed !== undefined) return configFromSeed(postData.seed)
	if (postData?.dailyNumber !== undefined && postData.dailyNumber > 0) {
		return configFromSeed(seedFromDailyNumber(postData.dailyNumber))
	}
	return undefined
}
