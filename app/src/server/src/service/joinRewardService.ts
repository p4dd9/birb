import { JOIN_REWARD_ATTEMPT_TIERS, JOIN_REWARD_LIVES, serverLogger, type LivesData } from '@birb/shared'
import {
	communityAttemptsKey,
	joinRewardClaimedKey,
	joinRewardOfferedKey,
	pushOptInKey,
	subscribedKey,
} from '@birb/shared/keys'
import { context, notifications, reddit, redis } from '@devvit/web/server'
import { addPlayerLives, syncPlayerLives } from './livesService'

/** Lifetime attempts for a user, reusing the per-user field of the community attempts hash. */
export const getUserTotalAttempts = async (userId: string): Promise<number> => {
	const raw = await redis.hGet(communityAttemptsKey(context.subredditId), userId)
	const n = Number(raw)
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/**
 * Pure: which attempt tier to prompt the join reward at right now, or null.
 * Returns the highest crossed tier, but only when the reward is unclaimed and
 * that tier hasn't already been offered (so a decline re-shows at the next tier only).
 */
export const computeJoinRewardPrompt = (options: {
	totalAttempts: number
	claimed: boolean
	offeredTier: number
}): number | null => {
	const { totalAttempts, claimed, offeredTier } = options
	if (claimed) return null

	for (let i = JOIN_REWARD_ATTEMPT_TIERS.length - 1; i >= 0; i--) {
		const tier = JOIN_REWARD_ATTEMPT_TIERS[i]!
		if (totalAttempts >= tier) {
			return tier > offeredTier ? tier : null
		}
	}
	return null
}

/** Resolve the join-reward state for AppData in a single round of reads. */
export const getJoinRewardState = async (userId: string): Promise<{ promptTier: number | null; claimed: boolean }> => {
	const [claimedFlag, offeredRaw, totalAttempts] = await Promise.all([
		redis.get(joinRewardClaimedKey(userId)),
		redis.get(joinRewardOfferedKey(userId)),
		getUserTotalAttempts(userId),
	])
	const claimed = claimedFlag === 'true'
	const offeredTier = Number(offeredRaw) || 0
	return { promptTier: computeJoinRewardPrompt({ totalAttempts, claimed, offeredTier }), claimed }
}

/** Record that the prompt has been shown at a tier, so it won't re-appear at that tier. */
export const markJoinRewardSeen = async (userId: string, tier: number): Promise<void> => {
	const prev = Number(await redis.get(joinRewardOfferedKey(userId))) || 0
	if (tier > prev) {
		await redis.set(joinRewardOfferedKey(userId), String(tier))
	}
}

/**
 * Accept the join reward: subscribe + opt in to push, then grant the one-time
 * lives bonus. Idempotent — a second call never double-grants.
 */
export const claimJoinReward = async (
	userId: string
): Promise<{ granted: number; lives: LivesData; alreadyClaimed?: boolean }> => {
	if ((await redis.get(joinRewardClaimedKey(userId))) === 'true') {
		return { granted: 0, lives: await syncPlayerLives(userId), alreadyClaimed: true }
	}

	await Promise.all([reddit.subscribeToCurrentSubreddit(), notifications.optInCurrentUser()])
	await Promise.all([redis.set(subscribedKey(userId), 'true'), redis.set(pushOptInKey(userId), 'true')])

	const lives = await addPlayerLives(userId, JOIN_REWARD_LIVES)
	await redis.set(joinRewardClaimedKey(userId), 'true')

	serverLogger.info(`Granted join reward to ${userId}: +${JOIN_REWARD_LIVES} lives`)
	return { granted: JOIN_REWARD_LIVES, lives }
}
