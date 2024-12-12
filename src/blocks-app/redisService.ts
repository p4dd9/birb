import { Devvit, type RedisClient } from '@devvit/public-api'
import type { AppData } from '../shared/messages'
import { ACTIVE_PLAYERS_HASH, ACTIVE_PLAYER_TTL } from './config/redis.config'
import { mapAppConfiguration } from './redisMapper'
import type { SaveScoreData } from './types/redis'

export class RedisService {
	context: Devvit.Context
	redis: RedisClient

	subredditId: string
	postId: string
	userId: string

	constructor(context: Devvit.Context) {
		this.context = context
		this.redis = context.redis

		this.subredditId = context.subredditId

		this.postId = context.postId!
		this.userId = context.userId!
	}

	async getAppData(): Promise<AppData> {
		const [appConfiguration, leaderboard, activeCommunityPlayers] = await Promise.all([
			this.getAppConfiguration(),
			this.getCommunityLeaderBoard(),
			this.getCommunityOnlinePlayers(),
		])

		return {
			config: mapAppConfiguration(appConfiguration),
			community: {
				name: this.context.subredditName ?? 'REDDIBIRDS',
				leaderboard: leaderboard,
				online: activeCommunityPlayers,
			},
			// https://developers.reddit.com/docs/api/public-api/#-redisclient
			// https://discord.com/channels/1050224141732687912/1242689538447507458/1316043291401125888
			global: {
				name: 'REDDIBIRDS GLOBAL',
				leaderboard: [],
			},
		}
	}

	async getPlayerStats() {
		const attempts = await this.redis.hGet(`post:${this.subredditId}:attempts`, this.userId)
		const highscore = await this.redis.zScore(`post:${this.subredditId}:highscores`, this.userId)

		const mappedStats = {
			highscore: highscore ? Number(highscore) : 0,
			attempts: attempts ? Number(attempts) : 0,
		}
		return mappedStats
	}

	async getPlayerByUserId(userId: string) {
		const attempts = await this.redis.hGet(`post:${this.subredditId}:attempts`, userId)
		const highscore = await this.redis.zScore(`post:${this.subredditId}:highscores`, userId)

		const mappedStats = {
			highscore: highscore ? Number(highscore) : 0,
			attempts: attempts ? Number(attempts) : 0,
		}
		return mappedStats
	}

	async saveScore(stats: SaveScoreData) {
		let mappedTopPlayer = '???'

		if (!this.userId) return { communityScore: 0, communityAttempts: 0, topPlayer: mappedTopPlayer }

		const currentTopPlayer = await this.redis.zRange(`post:${this.subredditId}:highscores`, 0, 0, {
			by: 'rank',
			reverse: true,
		})

		await this.redis.zAdd(`post:${this.subredditId}:highscores`, { member: this.userId, score: stats.highscore })

		const communityScore = await this.redis.hIncrBy(
			`community:${this.context.subredditId}:score`,
			this.context.subredditId,
			stats.score
		)
		const communityAttempts = await this.redis.hIncrBy(
			`community:${this.context.subredditId}:attempts`,
			this.context.subredditId,
			1
		)

		await this.redis.hIncrBy(`post:${this.subredditId}:attempts`, this.userId, 1)

		const newTopPlayer = await this.redis.zRange(`post:${this.subredditId}:highscores`, 0, 0, {
			by: 'rank',
			reverse: true,
		})

		const topPlayerUsername = currentTopPlayer[0]
			? ((await this.context.reddit.getUserById(currentTopPlayer[0].member))?.username ?? '???')
			: `???`

		if (!newTopPlayer || !newTopPlayer[0] || !this.postId) {
			return { communityScore, communityAttempts, topPlayer: topPlayerUsername }
		}

		if (!currentTopPlayer[0]?.member) {
			const newTopUserName = await this.context.reddit.getUserById(newTopPlayer[0].member)

			if (newTopUserName) {
				this.context.scheduler.runJob({
					name: 'FIRST_FLAPPER_COMMENT',
					data: {
						username: newTopUserName.username,
						postId: this.postId,
						score: stats.score,
					},
					runAt: new Date(),
				})
			}
		}

		// new highscore in community on posting
		if (currentTopPlayer[0]) {
			const currentCommunityhighscore = currentTopPlayer[0].score
			const score = stats.score
			if (score > currentCommunityhighscore) {
				const newTopUserName = await this.context.reddit.getUserById(newTopPlayer[0].member)

				if (newTopUserName) {
					this.context.scheduler.runJob({
						name: 'NEW_HIGHSCORE_COMMENT',
						data: {
							username: newTopUserName.username,
							postId: this.postId,
							score: stats.score,
						},
						runAt: new Date(),
					})
				}
			}
		}

		return { communityScore, communityAttempts, topPlayer: topPlayerUsername }
	}

	async getCommunityLeaderBoard(limit: number = 10) {
		const topPlayers = await this.redis.zRange(`post:${this.subredditId}:highscores`, 0, limit - 1, {
			by: 'rank',
			reverse: true,
		})

		const mappedBestPlayers = await Promise.all(
			topPlayers.map(async ({ member, score }) => {
				const userNameResponse = await this.context.reddit.getUserById(member)
				const attempts = await this.redis.hGet(`post:${this.subredditId}:attempts`, member)
				return {
					userId: member,
					userName: userNameResponse ? userNameResponse.username : 'Anonymous',
					score: Number(score),
					attempts: Number(attempts),
				}
			})
		)

		return mappedBestPlayers
	}

	async getAppConfiguration() {
		return await this.context.settings.getAll<Record<'worldSelect' | 'playerSelect' | 'pipeSelect', any>>()
	}

	async getCommunityOnlinePlayers() {
		const userId = this.userId
		if (!userId) return 1

		const now = Date.now()

		await this.context.redis.hSet(ACTIVE_PLAYERS_HASH, { [userId]: now.toString() })
		const players = await this.context.redis.hGetAll(ACTIVE_PLAYERS_HASH)
		if (players) {
			const onlinePlayers = Object.entries(players).filter(([_, timestamp]) => {
				return now - parseInt(timestamp, 10) <= ACTIVE_PLAYER_TTL
			})

			const stalePlayers = Object.keys(players).filter(
				(userId) => !onlinePlayers.some(([validId]) => validId === userId)
			)

			for (const stalePlayer of stalePlayers) {
				await this.context.redis.hDel(ACTIVE_PLAYERS_HASH, [stalePlayer])
			}

			return onlinePlayers.length
		}
		return 1
	}

	async getCommunityStats() {
		const communityScore =
			(await this.redis.hGet(`community:${this.context.subredditId}:score`, this.context.subredditId)) ?? 0
		const communityAttempts =
			(await this.redis.hGet(`community:${this.context.subredditId}:attempts`, this.context.subredditId)) ?? 0

		const currentTopPlayer = await this.redis.zRange(`post:${this.subredditId}:highscores`, 0, 0, {
			by: 'rank',
			reverse: true,
		})

		const topPlayerUsername = currentTopPlayer[0]
			? ((await this.context.reddit.getUserById(currentTopPlayer[0].member))?.username ?? '???')
			: `???`

		return {
			communityScore: Number(communityScore),
			communityAttempts: Number(communityAttempts),
			topPlayer: topPlayerUsername,
		}
	}
}
