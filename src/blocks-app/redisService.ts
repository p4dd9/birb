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

			console.log('getPlayerStats', { highscore, attempts }, userId, postId)
			const mappedStats = {
				highscore: highscore ? Number(highscore) : 0,
				attempts: attempts ? Number(attempts) : 0,
			}
			console.log('getPlayerStats', mappedStats)
			return mappedStats
		},

		saveScore: async (stats) => {
			if (!userId) return

			await redis.zAdd(`post:${postId}:highscores`, { member: userId, score: stats.highscore })
			await redis.hIncrBy(`post:${postId}:attempts`, userId, 1)

			console.log('savePersonalStats', stats, userId, postId)
		},

		getBestPlayer: async () => {
			const allKeys = await redis.zCard(`post:${postId}:highscores`)
			console.log('All Keys:', allKeys)

			const bestPlayer = await redis.zRange(`post:${postId}:highscores`, 0, 999999, { by: 'score' })
			console.log('bestPlayer: ' + JSON.stringify(bestPlayer))
			console.log('getBestPlayer', bestPlayer)

			if (bestPlayer.length === 0 || !bestPlayer[0]) return null

			const mappedBestPlayer = {
				userId: bestPlayer[0].member,
				score: Number(bestPlayer[0].score),
			}

			console.log('getBestPlayer', mappedBestPlayer)
			return mappedBestPlayer
		},

		getTopPlayers: async () => {
			const topPlayers = await redis.zRange(`post:${postId}:highscores`, 0, 999999)

			const mappedBestPlayers = topPlayers.map(({ member, score }) => ({
				userId: member,
				score: Number(score),
			}))

			console.log('getTopPlayers', mappedBestPlayers)
			return mappedBestPlayers
		},
	}
}
