import { Devvit, RichTextBuilder } from '@devvit/public-api'
import type { RedisPlayer } from '../shared/messages'

export type SaveScoreData = {
	highscore: number
	score: number
}

export type PlayerStats = {
	highscore: number
	attempts: number
}

export type CommunityStats = {
	communityScore: number
	communityAttempts: number
	topPlayer: string
}

export type RedisService = {
	getPlayerStats: () => Promise<PlayerStats | null>
	saveScore: (stats: SaveScoreData) => Promise<CommunityStats>
	getTopPlayers: () => Promise<Array<RedisPlayer>>
	getPlayerByUserId: (userId: string) => Promise<PlayerStats | null>
	getAppSettings: () => Promise<Record<'worldSelect' | 'playerSelect' | 'pipeSelect', any>>
	getCommunityStats: () => Promise<CommunityStats>
	saveUserInteraction: () => Promise<number | undefined>
}

const ACTIVE_PLAYERS_HASH = 'active_players'
const ACTIVE_PLAYER_TTL = 30 * 1000

export function createRedisService(context: Devvit.Context): RedisService {
	const { redis, subredditId, postId, userId } = context

	return {
		getPlayerStats: async () => {
			if (!userId) return null

			const attempts = await redis.hGet(`post:${subredditId}:attempts`, userId)
			const highscore = await redis.zScore(`post:${subredditId}:highscores`, userId)

			const mappedStats = {
				highscore: highscore ? Number(highscore) : 0,
				attempts: attempts ? Number(attempts) : 0,
			}
			return mappedStats
		},

		getPlayerByUserId: async (userId: string) => {
			if (!userId) return null

			const attempts = await redis.hGet(`post:${subredditId}:attempts`, userId)
			const highscore = await redis.zScore(`post:${subredditId}:highscores`, userId)

			const mappedStats = {
				highscore: highscore ? Number(highscore) : 0,
				attempts: attempts ? Number(attempts) : 0,
			}
			return mappedStats
		},

		saveScore: async (stats) => {
			let mappedTopPlayer = '???'

			if (!userId) return { communityScore: 0, communityAttempts: 0, topPlayer: mappedTopPlayer }

			const currentTopPlayer = await redis.zRange(`post:${subredditId}:highscores`, 0, 0, {
				by: 'rank',
				reverse: true,
			})

			await redis.zAdd(`post:${subredditId}:highscores`, { member: userId, score: stats.highscore })
			const communityScore = await redis.hIncrBy(
				`community:${context.subredditId}:score`,
				context.subredditId,
				stats.score
			)
			const communityAttempts = await redis.hIncrBy(
				`community:${context.subredditId}:attempts`,
				context.subredditId,
				1
			)

			await redis.hIncrBy(`post:${subredditId}:attempts`, userId, 1)

			const newTopPlayer = await redis.zRange(`post:${subredditId}:highscores`, 0, 0, {
				by: 'rank',
				reverse: true,
			})

			const topPlayerUsername = currentTopPlayer[0]
				? ((await context.reddit.getUserById(currentTopPlayer[0].member))?.username ?? '???')
				: `???`

			if (!newTopPlayer || !newTopPlayer[0] || !postId) {
				return { communityScore, communityAttempts, topPlayer: topPlayerUsername }
			}

			// new highscore on posting
			if (newTopPlayer[0].member !== currentTopPlayer[0]?.member) {
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

			return { communityScore, communityAttempts, topPlayer: topPlayerUsername }
		},

		getTopPlayers: async () => {
			const topPlayers = await redis.zRange(`post:${subredditId}:highscores`, 0, 9, {
				by: 'rank',
				reverse: true,
			})

			const mappedBestPlayers = await Promise.all(
				topPlayers.map(async ({ member, score }) => {
					const userNameResponse = await context.reddit.getUserById(member)
					const attempts = await redis.hGet(`post:${subredditId}:attempts`, member)
					return {
						userId: member,
						userName: userNameResponse ? userNameResponse.username : 'Anonymous',
						score: Number(score),
						attempts: Number(attempts),
					}
				})
			)

			return mappedBestPlayers
		},

		getAppSettings: async () => {
			return await context.settings.getAll<Record<'worldSelect' | 'playerSelect' | 'pipeSelect', any>>()
		},

		saveUserInteraction: async () => {
			const userId = context.userId
			if (!userId) return 0

			const now = Date.now()

			await context.redis.hSet(ACTIVE_PLAYERS_HASH, { [userId]: now.toString() })

			const players = await context.redis.hGetAll(ACTIVE_PLAYERS_HASH)
			if (players) {
				const onlinePlayers = Object.entries(players).filter(([_, timestamp]) => {
					return now - parseInt(timestamp, 10) <= ACTIVE_PLAYER_TTL
				})

				const stalePlayers = Object.keys(players).filter(
					(userId) => !onlinePlayers.some(([validId]) => validId === userId)
				)

				for (const stalePlayer of stalePlayers) {
					await context.redis.hDel(ACTIVE_PLAYERS_HASH, [stalePlayer])
				}

				return onlinePlayers.length
			}

			return 0
		},

		getCommunityStats: async () => {
			const communityScore =
				(await redis.hGet(`community:${context.subredditId}:score`, context.subredditId)) ?? 0
			const communityAttempts =
				(await redis.hGet(`community:${context.subredditId}:attempts`, context.subredditId)) ?? 0

			const currentTopPlayer = await redis.zRange(`post:${subredditId}:highscores`, 0, 0, {
				by: 'rank',
				reverse: true,
			})

			const topPlayerUsername = currentTopPlayer[0]
				? ((await context.reddit.getUserById(currentTopPlayer[0].member))?.username ?? '???')
				: `???`

			return {
				communityScore: Number(communityScore),
				communityAttempts: Number(communityAttempts),
				topPlayer: topPlayerUsername,
			}
		},
	}
}
