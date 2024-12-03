import { Devvit } from '@devvit/public-api'
import type { Player } from '../shared/messages'

export type SaveScoreData = {
	highscore: number
}

export type PlayerStats = {
	highscore: number
	attempts: number
}

export type RedisService = {
	getPlayerStats: () => Promise<PlayerStats | null>
	saveScore: (stats: SaveScoreData) => Promise<void>
	getBestPlayer: () => Promise<Player | null>
	getTopPlayers: () => Promise<Array<Player>>
}

export function createRedisService(context: Devvit.Context): RedisService {
	const { redis, postId, userId } = context

	return {
		getPlayerStats: async () => {
			if (!userId) return null

			const attempts = await redis.hGet(`post:${postId}:attempts`, userId)
			const highscore = await redis.zScore(`post:${postId}:highscores`, userId)

			const mappedStats = {
				highscore: highscore ? Number(highscore) : 0,
				attempts: attempts ? Number(attempts) : 0,
			}
			return mappedStats
		},

		saveScore: async (stats) => {
			if (!userId) return

			await redis.zAdd(`post:${postId}:highscores`, { member: userId, score: stats.highscore })
			await redis.hIncrBy(`post:${postId}:attempts`, userId, 1)
		},

		getBestPlayer: async () => {
			const bestPlayer = await redis.zRange(`post:${postId}:highscores`, 0, 1, {
				by: 'rank',
				reverse: true,
			})

			if (bestPlayer.length === 0 || !bestPlayer[0]) return null
			const bestPlayerUserName = await context.reddit.getUserById(bestPlayer[0].member)
			if (!bestPlayerUserName) return null

			const mappedBestPlayer = {
				userId: bestPlayer[0].member,
				userName: bestPlayerUserName.username,
				score: Number(bestPlayer[0].score),
			}

			return mappedBestPlayer
		},

		getTopPlayers: async () => {
			const topPlayers = await redis.zRange(`post:${postId}:highscores`, 0, 9, {
				by: 'rank',
				reverse: true,
			})

			const mappedBestPlayers = await Promise.all(
				topPlayers.map(async ({ member, score }) => {
					const userNameResponse = await context.reddit.getUserById(member)
					return {
						userId: member,
						userName: userNameResponse ? userNameResponse.username : 'Anonymous',
						score: Number(score),
					}
				})
			)

			return mappedBestPlayers
		},
	}
}
