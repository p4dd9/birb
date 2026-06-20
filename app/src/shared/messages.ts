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

export type AppIAP = {
	membershipActiveUntil: string | null
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
	iap: AppIAP
	subscribed: boolean
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
}

/** Response of `GET /api/v1/app/latest-daily-url`. */
export type LatestDailyUrlResponse = {
	url: string | null
}

/** Response of `POST /api/v1/subscribe`. */
export type SubscribeResponse = {
	subscribed: boolean
}

/** Body of `POST /api/v1/purchase`. */
export type PurchaseRequest = {
	sku: string
}

/** Body of `POST /api/v1/score/share`. */
export type ShareScoreCommentRequest = {
	comment: string
	score: number
}

/** Response of `POST /api/v1/score/share`. */
export type ShareScoreCommentResponse = {
	ok: true
}
