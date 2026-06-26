/**
 * HTTP request/response DTOs shared between the Phaser client and the Express
 * server. (Replaces the old postMessage message contract.)
 */

/** Cosmetics for a daily level, derived deterministically from its seed. */
export type AppConfiguration = {
	world: string
	playerFrame: number
	pipeFrame: number
}

export type BirbPostType = 'launcher' | 'daily'

/** Data baked into a Birb custom post, read on the client via `context.postData`. */
export type BirbPostData = {
	type: BirbPostType
	/** Numeric seed driving the deterministic level (daily posts only). */
	seed?: number
	/** UTC day this level belongs to, formatted YYYY-MM-DD (daily posts only). */
	dateKey?: string
	/** Global daily index (#1, #2, …) — unique per daily post. */
	dailyNumber?: number
	/** Cosmetics derived from `seed` — set server-side in `setPostData` for instant client theming. */
	config?: AppConfiguration
}

/** @deprecated Use BirbPostData — kept for call sites that expect daily fields. */
export type DailyPostData = BirbPostData & {
	type: 'daily'
	seed: number
	dateKey: string
	dailyNumber: number
}

/** A single row of the per-daily leaderboard. */
export type DailyLeaderboardEntry = {
	userId: string
	userName: string
	score: number
	attempts: number
	taps: number
}

/** Server-authoritative lives pool for the calling user. */
export type LivesData = {
	count: number
	/** Epoch ms when the next free +5 refill arrives; null when at/above the free cap. */
	nextRefillAt: number | null
	freeCap: number
}

/** The calling user's own stats for the current daily. */
export type YouStats = {
	highscore: number
	attempts: number
	taps: number
	rank: number | null
}

export type CommunityStats = {
	communityScore: number
	communityAttempts: number
	communityPlayers: number
}

/** Drives the one-time "join & subscribe" reward popup. */
export type JoinRewardState = {
	/** Attempt tier to prompt at right now, or null when there's nothing to show. */
	promptTier: number | null
	/** True once the player has claimed the one-time reward. */
	claimed: boolean
}

/** Response of `GET /api/v1/app-data`, scoped to the post's daily. */
export type AppData = {
	config: AppConfiguration
	name: string
	dateKey: string
	/** This post's daily number (#1, #2, …). */
	dailyNumber: number
	/** Most recently created daily number — only that post accepts new runs. */
	latestDailyNumber: number
	/** URL of the active daily post; null when no dailies exist yet. */
	latestDailyPostUrl: string | null
	you: YouStats
	online: number
	leaderboard: DailyLeaderboardEntry[]
	stats: CommunityStats
	lives: LivesData
	subscribed: boolean
	/** Whether the caller has opted in to push notifications. */
	pushNotifications: boolean
	/** Server-saved audio mute preference (true = muted). */
	audioMuted: boolean
	/** State of the one-time join-and-subscribe reward prompt. */
	joinReward: JoinRewardState
	/** True when the caller already claimed the one-time share-highscore life bonus for this daily. */
	shareRewardClaimed: boolean
}

/** Body of `POST /api/v1/score`. */
export type SaveScoreRequest = {
	/** The daily this run belongs to (the post's dailyNumber). */
	dailyNumber: number
	score: number
	/** Number of flaps/taps in the run. */
	taps: number
}

/** Response of `POST /api/v1/score`. */
export type SaveScoreResponse = {
	isNewHighScore: boolean
	highscore: number
	attempts: number
	lives: LivesData
}

/** Response of `GET /api/v1/app/latest-daily-url`. */
export type LatestDailyUrlResponse = {
	url: string | null
}

/** Response of `POST /api/v1/app/subscribe` and `/unsubscribe`. */
export type SubscribeResponse = {
	subscribed: boolean
}

/** Response of `POST /api/v1/app/push/opt-in` and `/opt-out`. */
export type PushOptInResponse = {
	pushNotifications: boolean
}

/** Response of `POST /api/v1/app/audio`. */
export type AudioPrefResponse = {
	muted: boolean
}

/** Response of `POST /api/v1/reward/join/claim`. */
export type ClaimJoinRewardResponse = {
	/** Lives granted by this call (0 when already claimed). */
	granted: number
	/** Player's lives pool after the grant. */
	lives: LivesData
	/** True when the reward had already been claimed (no double-grant). */
	alreadyClaimed?: boolean
}

/** Body of `POST /api/v1/score/share`. */
export type ShareScoreCommentRequest = {
	comment: string
	score: number
	/** Flaps/taps in the run being shared. */
	taps: number
	/** Daily the shared highscore belongs to — scopes the one-time life bonus. */
	dailyNumber: number
}

/** Response of `POST /api/v1/score/share`. */
export type ShareScoreCommentResponse = {
	ok: true
	/** Player's lives pool after any share bonus was applied. */
	lives: LivesData
	/** True when this share granted the one-time +5 life bonus for the daily. */
	rewarded: boolean
}
