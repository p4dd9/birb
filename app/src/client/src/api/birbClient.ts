import type {
	AppConfiguration,
	AppData,
	AudioPrefResponse,
	BirbPostData,
	BirbPostType,
	ClaimJoinRewardResponse,
	LatestDailyUrlResponse,
	PushOptInResponse,
	SaveScoreRequest,
	SaveScoreResponse,
	ShareScoreCommentRequest,
	ShareScoreCommentResponse,
	SubscribeResponse,
} from '@birb/shared'
import {
	clientLogger,
	configFromSeed,
	resolveConfigFromPostData,
	resolveDailySeed,
} from '@birb/shared'
import { context, navigateTo, showToast } from '@devvit/web/client'
import { applyShellTheme } from '../util/dom'
import { birbBridge } from './birbBridge'

const APP_DATA_POLL_MS = 10_000

let pollHandle: ReturnType<typeof setInterval> | null = null

const getPostData = (): BirbPostData | undefined => context.postData as BirbPostData | undefined

export const getPostType = (): BirbPostType => getPostData()?.type ?? 'launcher'

export const isDailyPost = (): boolean => getPostType() === 'daily'

export const getDailyNumber = (): number | undefined => getPostData()?.dailyNumber

/** True when this daily post is still accepting runs (i.e. it is the latest daily). */
export const isActiveDailyPost = (appData?: AppData | null): boolean => {
	if (!isDailyPost()) return true
	const postDaily = getDailyNumber()
	const latest = appData?.latestDailyNumber ?? birbBridge.getAppData()?.latestDailyNumber
	if (postDaily === undefined || latest === undefined || latest === 0) return false
	return postDaily === latest
}

/** Background music only on the current playable daily post. */
export const shouldAutoplayMusic = (appData?: AppData | null): boolean =>
	isDailyPost() && isActiveDailyPost(appData)

export const fetchLatestDailyPostUrl = async (): Promise<string | null> => {
	const res = await fetch('/api/v1/app/latest-daily-url')
	if (!res.ok) {
		throw new Error(`GET /api/v1/app/latest-daily-url failed (${res.status}): ${await res.text()}`)
	}
	const body = (await res.json()) as LatestDailyUrlResponse
	return body.url
}

/** Open the current daily post from an archived daily (or after a stale cache). */
export const navigateToLatestDaily = async (): Promise<void> => {
	let url: string | null = null

	try {
		const appData = await refreshAppData()
		url = appData?.latestDailyPostUrl ?? null
	} catch (error) {
		clientLogger.error('Failed to refresh app data for latest daily URL', error)
	}

	if (!url) {
		try {
			url = await fetchLatestDailyPostUrl()
			const appData = birbBridge.getAppData()
			if (url && appData) {
				birbBridge.setAppData({ ...appData, latestDailyPostUrl: url })
			}
		} catch (error) {
			clientLogger.error('Failed to resolve latest daily URL', error)
		}
	}

	if (!url) {
		showToast('No active daily found.')
		return
	}

	navigateTo(url)
}

export const fetchAppData = async (dailyNumber?: number): Promise<AppData> => {
	const query =
		dailyNumber !== undefined && dailyNumber > 0 ? `?dailyNumber=${encodeURIComponent(String(dailyNumber))}` : ''
	const res = await fetch(`/api/v1/app/data${query}`)
	if (!res.ok) {
		throw new Error(`GET /api/v1/app/data failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<AppData>
}

export const saveScore = async (body: SaveScoreRequest): Promise<SaveScoreResponse> => {
	const res = await fetch('/api/v1/score', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) {
		throw new Error(`POST /api/v1/score failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<SaveScoreResponse>
}

export const shareScoreComment = async (body: ShareScoreCommentRequest): Promise<ShareScoreCommentResponse> => {
	const res = await fetch('/api/v1/score/share', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	if (!res.ok) {
		throw new Error(`POST /api/v1/score/share failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<ShareScoreCommentResponse>
}

const postJson = async <T>(path: string, body?: unknown): Promise<T> => {
	const res = await fetch(path, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body ?? {}),
	})
	if (!res.ok) {
		throw new Error(`POST ${path} failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<T>
}

/** Follow/unfollow the subreddit (subscribes the current user on Reddit + mirrors the flag). */
export const subscribe = (): Promise<SubscribeResponse> => postJson('/api/v1/app/subscribe')
export const unsubscribe = (): Promise<SubscribeResponse> => postJson('/api/v1/app/unsubscribe')

/** Opt the current user in/out of push notifications. */
export const optInPush = (): Promise<PushOptInResponse> => postJson('/api/v1/app/push/opt-in')
export const optOutPush = (): Promise<PushOptInResponse> => postJson('/api/v1/app/push/opt-out')

/** Persist the user's audio mute preference server-side. */
export const saveAudioPref = (muted: boolean): Promise<AudioPrefResponse> => postJson('/api/v1/app/audio', { muted })

/** Record that the join-reward prompt was shown at a tier (so it won't re-show there). */
export const markJoinRewardSeen = (tier: number): Promise<{ ok: true }> =>
	postJson('/api/v1/reward/join/seen', { tier })

/** Accept the join reward: subscribe + push opt-in + one-time lives grant. Refreshes app data. */
export const claimJoinReward = async (): Promise<ClaimJoinRewardResponse> => {
	const result = await postJson<ClaimJoinRewardResponse>('/api/v1/reward/join/claim')
	await refreshAppData()
	return result
}

/** Cosmetics from postData (sync) or app data fetch (async fallback). */
export const resolveAppConfig = (appData?: AppData): AppConfiguration => {
	const fromPost = resolveConfigFromPostData(getPostData())
	if (fromPost) return fromPost
	if (appData) {
		return configFromSeed(resolveDailySeed(appData.dailyNumber, getPostData()?.seed))
	}
	return configFromSeed(0)
}

/** Apply pipe/shell theme immediately from baked postData — before the app-data fetch. */
export const applyShellThemeFromPostData = (): void => {
	const config = resolveConfigFromPostData(getPostData())
	if (config) applyShellTheme(config.pipeFrame)
}

/** Seed Phaser registry cosmetics from postData before community app-data arrives. */
export const applyPostDataToRegistry = (game: Phaser.Game): void => {
	const postData = getPostData()
	const config = resolveConfigFromPostData(postData)
	if (!config) return

	const dailyNumber = postData?.dailyNumber ?? 0
	const seed = resolveDailySeed(dailyNumber, postData?.seed)

	game.registry.set('daily:seed', seed)
	game.registry.set('pipeFrame', config.pipeFrame)
	game.registry.set('playerFrame', config.playerFrame)
	game.registry.set('background', config.world)
	if (postData?.dailyNumber !== undefined) {
		game.registry.set('daily:number', postData.dailyNumber)
	}
}

/** Push shared app state into Phaser registry keys the scenes already read. */
export const applyAppDataToRegistry = (game: Phaser.Game, appData: AppData): void => {
	const config = resolveAppConfig(appData)
	const seed = resolveDailySeed(appData.dailyNumber, getPostData()?.seed)

	applyShellTheme(config.pipeFrame)

	game.registry.set('daily:seed', seed)
	game.registry.set('pipeFrame', config.pipeFrame)
	game.registry.set('playerFrame', config.playerFrame)
	game.registry.set('background', config.world)
	game.registry.set('community:leaderboard', appData.leaderboard)
	game.registry.set('community:online', appData.online)
	game.registry.set('community:stats', appData.stats)
	game.registry.set('community:you', appData.you)
	game.registry.set('daily:dateKey', appData.dateKey)
	game.registry.set('daily:number', appData.dailyNumber)
	game.registry.set('daily:latestNumber', appData.latestDailyNumber)
	game.registry.set('daily:latestPostUrl', appData.latestDailyPostUrl)
	game.registry.set('lives', appData.lives)
}

const publishAppData = (appData: AppData): void => {
	applyShellTheme(resolveAppConfig(appData).pipeFrame)
	birbBridge.setAppData(appData)
}

export const refreshAppData = async (): Promise<AppData | null> => {
	try {
		const appData = await fetchAppData(getDailyNumber())
		publishAppData(appData)
		return appData
	} catch (error) {
		clientLogger.error('App data refresh failed', error)
		return null
	}
}

export const initBirbClient = async (): Promise<void> => {
	try {
		const appData = await fetchAppData(getDailyNumber())
		publishAppData(appData)
	} catch (error) {
		clientLogger.error('Initial app data fetch failed', error)
	}

	// Archived dailies are frozen and unplayable — nothing to refresh, and we
	// don't want them stamping the online-presence heartbeat. Checked after the
	// initial fetch so isActiveDailyPost can read the just-published appData.
	if (isDailyPost() && !isActiveDailyPost()) return

	if (pollHandle) clearInterval(pollHandle)
	pollHandle = setInterval(() => {
		void refreshAppData()
	}, APP_DATA_POLL_MS)
}
