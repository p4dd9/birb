import type { CommunityStats } from '@birb/shared'
import {
	ACTIVE_PLAYERS_HASH,
	ACTIVE_PLAYER_TTL,
	communityAttemptsKey,
	communityHighscoresKey,
	communityScoreKey,
} from '@birb/shared'
import { context, redis } from '@devvit/web/server'

export const touchOnlinePlayers = async (userId: string): Promise<number> => {
	const now = Date.now()
	await redis.hSet(ACTIVE_PLAYERS_HASH, { [userId]: now.toString() })

	const players = await redis.hGetAll(ACTIVE_PLAYERS_HASH)
	let onlinePlayersCount = 0
	const stalePlayers: string[] = []

	for (const [id, timestamp] of Object.entries(players)) {
		if (now - Number(timestamp) <= ACTIVE_PLAYER_TTL) {
			onlinePlayersCount += 1
		} else {
			stalePlayers.push(id)
		}
	}

	if (stalePlayers.length > 0) {
		await redis.hDel(ACTIVE_PLAYERS_HASH, stalePlayers)
	}

	return onlinePlayersCount
}

export const getCommunityStats = async (): Promise<CommunityStats> => {
	const subredditId = context.subredditId
	const [communityScore, communityAttempts, communityPlayers] = await Promise.all([
		redis.hGet(communityScoreKey(subredditId), subredditId),
		redis.hGet(communityAttemptsKey(subredditId), subredditId),
		redis.zCard(communityHighscoresKey(subredditId)),
	])

	return {
		communityScore: Number(communityScore ?? 0),
		communityAttempts: Number(communityAttempts ?? 0),
		communityPlayers: Number(communityPlayers ?? 0),
	}
}

export const incrementCommunityScore = async (score: number): Promise<number> =>
	redis.hIncrBy(communityScoreKey(context.subredditId), context.subredditId, score)

export const incrementCommunityAttempts = async (): Promise<number> =>
	redis.hIncrBy(communityAttemptsKey(context.subredditId), context.subredditId, 1)
