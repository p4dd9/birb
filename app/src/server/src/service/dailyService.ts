import type { DailyLeaderboardEntry, SaveScoreResponse, YouStats } from '@birb/shared'
import {
	communityAttemptsKey,
	communityHighscoresKey,
	configFromSeed,
	DAILY_COUNTER_KEY,
	DAILY_INDEX_KEY,
	DAILY_LATEST_POST_URL_KEY,
	DAILY_LATEST_NUMBER_KEY,
	dailyAttemptsKey,
	dailyDateKey,
	dailyPostIdKey,
	dailyPostUrlKey,
	dailyScoresKey,
	dailySeedKey,
	dailyTapsKey,
	seedFromDailyNumber,
	serverLogger,
	toDateKey,
	postFlairStyleForFrame,
	formatDailyPostTitle,
	matchesDailyPostTitle,
} from '@birb/shared'
import { context, reddit, redis } from '@devvit/web/server'
import type { Post } from '@devvit/reddit'
import { incrementCommunityAttempts, incrementCommunityScore } from './communityService'
import { postDailyIntroComment, postDailyWrapUpComment } from './commentService'

const listSubredditPosts = async (subredditName: string) => {
	const [hot, newest] = await Promise.all([
		reddit.getHotPosts({ subredditName, limit: 100 }).all(),
		reddit.getNewPosts({ subredditName, limit: 100 }).all(),
	])
	const seen = new Set<string>()
	const merged = []
	for (const post of [...hot, ...newest]) {
		if (seen.has(post.id)) continue
		seen.add(post.id)
		merged.push(post)
	}
	return merged
}

/** URL suitable for client `navigateTo` — prefer the comments permalink. */
export const resolvePostNavigateUrl = (post: Pick<Post, 'url' | 'permalink'>): string => {
	const { permalink } = post
	if (permalink) {
		return permalink.startsWith('http') ? permalink : `https://www.reddit.com${permalink}`
	}
	return post.url
}

const cacheDailyPostNavigation = async (dailyNumber: number, post: Pick<Post, 'id' | 'url' | 'permalink'>) => {
	const url = resolvePostNavigateUrl(post)
	await Promise.all([
		redis.set(dailyPostIdKey(dailyNumber), post.id),
		redis.set(dailyPostUrlKey(dailyNumber), url),
	])
	return url
}

/** Reddit post id for a daily — cached, then resolved from subreddit lookup. */
export const getDailyPostId = async (dailyNumber: number): Promise<string | null> => {
	const cached = await redis.get(dailyPostIdKey(dailyNumber))
	if (cached) return cached

	await findDailyPostByNumber(dailyNumber)
	return (await redis.get(dailyPostIdKey(dailyNumber))) ?? null
}

const closePreviousDaily = async (dailyNumber: number): Promise<void> => {
	const postId = await getDailyPostId(dailyNumber)
	if (!postId) {
		serverLogger.error(`Cannot close daily #${dailyNumber}: post id not found`)
		return
	}

	const [leader] = await getDailyLeaderboard(dailyNumber, 1)
	await postDailyWrapUpComment(postId, dailyNumber, leader ?? null)

	try {
		const post = await reddit.getPostById(postId as `t3_${string}`)
		await post.unsticky()
	} catch (e) {
		serverLogger.error(`Failed unpinning daily #${dailyNumber} post ${postId}: ${e}`)
	}
}

const findDailyPostByNumber = async (dailyNumber: number): Promise<string | null> => {
	const subredditName = context.subredditName
	if (!subredditName) return null

	try {
		const posts = await listSubredditPosts(subredditName)
		const match = posts.find((post) => matchesDailyPostTitle(post.title, dailyNumber))
		if (!match) return null

		const url = await cacheDailyPostNavigation(dailyNumber, match)
		const latest = await getLatestDailyNumber()
		if (dailyNumber === latest) {
			await Promise.all([
				redis.set(DAILY_LATEST_POST_URL_KEY, url),
				redis.set(DAILY_LATEST_NUMBER_KEY, String(dailyNumber)),
			])
		}
		return url
	} catch (e) {
		serverLogger.error(`Failed looking up daily #${dailyNumber} post: ${e}`)
		return null
	}
}

/**
 * Create the next numbered daily post (#1, #2, …).
 * Multiple dailies can be created on the same UTC day.
 */
export const createDailyPost = async (): Promise<{ postId: string; url: string; dailyNumber: number }> => {
	const dailyNumber = await redis.incrBy(DAILY_COUNTER_KEY, 1)
	const dateKey = toDateKey()
	const seed = seedFromDailyNumber(dailyNumber)
	const config = configFromSeed(seed)

	const dailyPostData = { type: 'daily' as const, seed, dateKey, dailyNumber, config }

	const post = await reddit.submitCustomPost({
		title: formatDailyPostTitle(dailyNumber),
		entry: 'daily',
		runAs: 'APP',
		postData: dailyPostData,
	})

	await reddit.setPostData(post.id, dailyPostData)

	const navigateUrl = await cacheDailyPostNavigation(dailyNumber, post)

	await Promise.all([
		redis.set(dailySeedKey(dailyNumber), String(seed)),
		redis.set(dailyDateKey(dailyNumber), dateKey),
		redis.set(DAILY_LATEST_POST_URL_KEY, navigateUrl),
		redis.set(DAILY_LATEST_NUMBER_KEY, String(dailyNumber)),
		redis.zAdd(DAILY_INDEX_KEY, { member: String(dailyNumber), score: Date.now() }),
	])

	reddit
		.setPostFlair({
			postId: post.id,
			subredditName: context.subredditName,
			text: 'Daily',
			...postFlairStyleForFrame(config.pipeFrame),
		})
		.catch((e) => serverLogger.error(`Failed setting daily post flair: ${e}`))

	post.sticky(1).catch((e) => serverLogger.error(`Failed pinning daily #${dailyNumber}: ${e}`))

	try {
		await postDailyIntroComment(post.id, dailyNumber)
	} catch (e) {
		serverLogger.error(`Failed posting intro comment on daily #${dailyNumber}: ${e}`)
	}

	if (dailyNumber > 1) {
		try {
			await closePreviousDaily(dailyNumber - 1)
		} catch (e) {
			serverLogger.error(`Failed closing daily #${dailyNumber - 1} after creating #${dailyNumber}: ${e}`)
		}
	}

	serverLogger.info(`Created daily #${dailyNumber} for ${dateKey}: ${post.id} (seed ${seed})`)
	return { postId: post.id, url: navigateUrl, dailyNumber }
}

/** Most recently created daily number, or 0 if none exist. */
export const getLatestDailyNumber = async (): Promise<number> => {
	const latest = await redis.zRange(DAILY_INDEX_KEY, 0, 0, { by: 'rank', reverse: true })
	return latest[0] ? Number(latest[0].member) : 0
}

/** Reddit URL of the active daily post — cached, then resolved from post id / subreddit lookup. */
export const getLatestDailyPostUrl = async (): Promise<string | null> => {
	const latestNumber = await getLatestDailyNumber()
	if (latestNumber === 0) return null

	const [cached, cachedNumberRaw] = await Promise.all([
		redis.get(DAILY_LATEST_POST_URL_KEY),
		redis.get(DAILY_LATEST_NUMBER_KEY),
	])
	const cachedNumber = Number(cachedNumberRaw ?? 0)
	if (cached && cachedNumber === latestNumber) return cached

	const perDailyUrl = await redis.get(dailyPostUrlKey(latestNumber))
	if (perDailyUrl) {
		await Promise.all([
			redis.set(DAILY_LATEST_POST_URL_KEY, perDailyUrl),
			redis.set(DAILY_LATEST_NUMBER_KEY, String(latestNumber)),
		])
		return perDailyUrl
	}

	const postId = await redis.get(dailyPostIdKey(latestNumber))
	if (postId) {
		try {
			const post = await reddit.getPostById(postId as `t3_${string}`)
			if (post) {
				const url = await cacheDailyPostNavigation(latestNumber, post)
				await Promise.all([
					redis.set(DAILY_LATEST_POST_URL_KEY, url),
					redis.set(DAILY_LATEST_NUMBER_KEY, String(latestNumber)),
				])
				return url
			}
		} catch (e) {
			serverLogger.error(`Failed resolving daily #${latestNumber} post ${postId}: ${e}`)
		}
	}

	const discovered = await findDailyPostByNumber(latestNumber)
	return discovered
}

/** UTC day a daily was created on. */
export const getDailyDateKey = async (dailyNumber: number): Promise<string | undefined> =>
	(await redis.get(dailyDateKey(dailyNumber))) ?? undefined

/** The seed for a given daily (derived deterministically, persisted on create). */
export const getDailySeed = async (dailyNumber: number): Promise<number> => {
	const stored = await redis.get(dailySeedKey(dailyNumber))
	return stored ? Number(stored) : seedFromDailyNumber(dailyNumber)
}

/** The calling user's own stats for a daily. */
export const getYouStats = async (userId: string, dailyNumber: number): Promise<YouStats> => {
	const [highscore, attempts, taps, rank, total] = await Promise.all([
		redis.zScore(dailyScoresKey(dailyNumber), userId),
		redis.hGet(dailyAttemptsKey(dailyNumber), userId),
		redis.hGet(dailyTapsKey(dailyNumber), userId),
		redis.zRank(dailyScoresKey(dailyNumber), userId),
		redis.zCard(dailyScoresKey(dailyNumber)),
	])

	return {
		highscore: Number(highscore ?? 0),
		attempts: Number(attempts ?? 0),
		taps: Number(taps ?? 0),
		rank: rank === undefined ? null : total - rank,
	}
}

/** Top N rows of a daily's leaderboard, joined with username/attempts/taps. */
export const getDailyLeaderboard = async (dailyNumber: number, limit = 10): Promise<DailyLeaderboardEntry[]> => {
	const top = await redis.zRange(dailyScoresKey(dailyNumber), 0, limit - 1, { by: 'rank', reverse: true })

	const rows = await Promise.all(
		top.map(async ({ member, score }) => {
			try {
				const [user, attempts, taps] = await Promise.all([
					reddit.getUserById(member as `t2_${string}`),
					redis.hGet(dailyAttemptsKey(dailyNumber), member),
					redis.hGet(dailyTapsKey(dailyNumber), member),
				])
				return {
					userId: member,
					userName: user ? user.username : 'Anonymous',
					score,
					attempts: Number(attempts ?? 0),
					taps: Number(taps ?? 0),
				}
			} catch (e) {
				serverLogger.error(`Failed building daily leaderboard row for ${member}: ${e}`)
				return null
			}
		})
	)

	return rows.filter((r): r is DailyLeaderboardEntry => r !== null)
}

/**
 * Record a finished run for a daily: best score, attempts, taps, and the all-time
 * community rollups.
 */
export const saveDailyScore = async (
	userId: string,
	username: string,
	dailyNumber: number,
	score: number,
	taps: number
): Promise<Omit<SaveScoreResponse, 'lives'>> => {
	const subredditId = context.subredditId
	const scoresKey = dailyScoresKey(dailyNumber)

	const prevBestRaw = await redis.zScore(scoresKey, userId)

	const prevBest = Number(prevBestRaw ?? 0)
	const isNewHighScore = score > prevBest
	const isHighScoreRun = score >= prevBest

	// Per-daily attempts; taps reflect the highscore run only
	const attempts = await redis.hIncrBy(dailyAttemptsKey(dailyNumber), userId, 1)
	if (isHighScoreRun) {
		await Promise.all([
			redis.zAdd(scoresKey, { member: userId, score }),
			redis.hSet(dailyTapsKey(dailyNumber), { [userId]: String(taps) }),
		])
	}

	// All-time community rollups (stats + distinct player count)
	await Promise.all([
		redis.zAdd(communityHighscoresKey(subredditId), { member: userId, score: Math.max(prevBest, score) }),
		redis.hIncrBy(communityAttemptsKey(subredditId), userId, 1),
		incrementCommunityScore(score),
		incrementCommunityAttempts(),
	])

	return {
		isNewHighScore,
		highscore: Math.max(prevBest, score),
		attempts,
	}
}
