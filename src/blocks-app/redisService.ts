import { Devvit, RichTextBuilder } from '@devvit/public-api'
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
	getTopPlayers: () => Promise<Array<Player>>
	getPlayerByUserId: (userId: string) => Promise<PlayerStats | null>
	getAppSettings: () => Promise<Record<'worldSelect' | 'playerSelect' | 'pipeSelect', any>>
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

		getPlayerByUserId: async (userId: string) => {
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

			const currentTopPlayer = await redis.zRange(`post:${postId}:highscores`, 0, 0, {
				by: 'rank',
				reverse: true,
			})

			await redis.zAdd(`post:${postId}:highscores`, { member: userId, score: stats.highscore })
			await redis.hIncrBy(`post:${postId}:attempts`, userId, 1)

			const newTopPlayer = await redis.zRange(`post:${postId}:highscores`, 0, 0, {
				by: 'rank',
				reverse: true,
			})

			if (!newTopPlayer || !newTopPlayer[0] || !postId) {
				return
			}

			if (newTopPlayer.length > 0 && newTopPlayer[0].member !== (currentTopPlayer[0]?.member || null)) {
				const newTopUserName = await context.reddit.getUserById(newTopPlayer[0].member)

				if (newTopUserName) {
					const comment = await context.reddit.submitComment({
						id: postId,
						richtext: new RichTextBuilder().codeBlock({}, (cb) =>
							cb.rawText(
								`WOW! "${newTopUserName.username}" scored a new highscore: ${newTopPlayer[0]?.score}!`
							)
						),
					})

					if (comment) {
						context.ui.showToast('Your fantastic highscore was shared as a comment!')
					}
				}
			}
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

		getAppSettings: async () => {
			return await context.settings.getAll<Record<'worldSelect' | 'playerSelect' | 'pipeSelect', any>>()
		},
	}
}
