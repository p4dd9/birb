import type { DailyLeaderboardEntry } from '@birb/shared'
import { dailyClosedCommentKey, dailyIntroCommentKey, serverLogger } from '@birb/shared'
import { context, reddit, redis } from '@devvit/web/server'

/** Post the player's share comment on the current post thread. */
export const shareScoreComment = async (comment: string, score: number) => {
	const postId = context.postId
	if (!postId) {
		throw new Error('Missing postId')
	}

	const trimmed = comment.trim()
	if (!trimmed) {
		throw new Error('Comment is required')
	}

	const text = `${trimmed}\n\nHighscore: ${score}`

	await reddit.submitComment({
		id: postId,
		text,
		runAs: 'USER',
	})
}

const BIRB_DESCRIPTION = `**What is Birb?**

Birb is an arcade game built for Reddit. Tap to birb up through pipes on the daily level, everyone gets the same level each day. Lives re-stock up to 25, giving +5 every 6 hours.`

const formatDailyWrapUpComment = (dailyNumber: number, leader: DailyLeaderboardEntry | null): string => {
	const highscoreLine = leader
		? `**#${dailyNumber} highscore:** u/${leader.userName} — **${leader.score}** points in **${leader.taps}** flaps`
		: `**#${dailyNumber} highscore:** No one scored on this daily.`

	return `${BIRB_DESCRIPTION}

---

**Daily #${dailyNumber} is closed**

A new daily has been posted, so **scores are locked** on this post from this moment on and no longer count.

${highscoreLine}

Head to today's daily post via the Play button to compete!`
}

const submitStickyAppComment = async (postId: string, text: string) => {
	const comment = await reddit.submitComment({
		id: postId as `t3_${string}`,
		text,
		runAs: 'APP',
	})
	await comment.distinguish(true)
	return comment
}

/** Sticky intro comment on a newly created daily — the shared Birb description blurb. */
export const postDailyIntroComment = async (postId: string, dailyNumber: number): Promise<void> => {
	const introKey = dailyIntroCommentKey(dailyNumber)
	if (await redis.get(introKey)) {
		return
	}

	try {
		const comment = await submitStickyAppComment(postId, BIRB_DESCRIPTION)
		await redis.set(introKey, comment.id)
		serverLogger.info(`Posted intro comment on daily #${dailyNumber}: ${comment.id}`)
	} catch (e) {
		serverLogger.error(`Failed posting intro comment on daily #${dailyNumber}: ${e}`)
		throw e
	}
}

/**
 * Sticky mod-distinguished comment on a finished daily: game blurb, score lock notice,
 * and revealed highscore. Idempotent per daily number.
 */
export const postDailyWrapUpComment = async (
	postId: string,
	dailyNumber: number,
	leader: DailyLeaderboardEntry | null
): Promise<void> => {
	const closedKey = dailyClosedCommentKey(dailyNumber)
	if (await redis.get(closedKey)) {
		return
	}

	try {
		const comment = await submitStickyAppComment(postId, formatDailyWrapUpComment(dailyNumber, leader))
		await redis.set(closedKey, comment.id)
		serverLogger.info(`Posted wrap-up comment on daily #${dailyNumber}: ${comment.id}`)
	} catch (e) {
		serverLogger.error(`Failed posting wrap-up comment on daily #${dailyNumber}: ${e}`)
		throw e
	}
}
