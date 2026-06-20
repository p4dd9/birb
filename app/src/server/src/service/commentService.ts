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

Birb is a Flappy Bird-style arcade game built for Reddit. Tap or click to flap through pipes on a shared daily level — everyone gets the same layout each day.`

const formatDailyWrapUpComment = (dailyNumber: number, leader: DailyLeaderboardEntry | null): string => {
	const highscoreLine = leader
		? `**#${dailyNumber} highscore:** u/${leader.userName} — **${leader.score}** points`
		: `**#${dailyNumber} highscore:** No one scored on this daily.`

	return `${BIRB_DESCRIPTION}

---

**Daily #${dailyNumber} is closed**

A new daily has been posted, so **scores are locked** on this post from this moment on and no longer count.

While this daily was live, the leaderboard was hidden so no one could peek at the top score. It is revealed here now that the next daily is up.

${highscoreLine}

Head to today's daily post to compete on the current board!`
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
