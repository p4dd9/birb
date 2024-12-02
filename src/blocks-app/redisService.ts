import { Devvit } from '@devvit/public-api'
import type { Stats } from '../shared/types'

export type RedisService = {
	getPersonalStats: () => Promise<Stats | null>
	savePersonalStats: (stats: Stats) => Promise<void>
}

export function createRedisService(context: Devvit.Context): RedisService {
	const { redis, postId, userId } = context
	return {
		getPersonalStats: async () => {
			const retrievedStats = await redis.get(`playerstats_${postId}_${userId}`)
			console.log('getPersonalStats', retrievedStats, userId, postId)
			return retrievedStats ? JSON.parse(retrievedStats) : null
		},
		savePersonalStats: async (stats) => {
			await redis.set(`playerstats_${postId}_${userId}`, JSON.stringify(stats))
			console.log('savePersonalStats', stats, userId, postId)
		},
	}
}
