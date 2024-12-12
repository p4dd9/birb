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
		const [appConfiguration, leaderboard, activeCommunityPlayers, communityStats, youStats] = await Promise.all([
			this.getAppConfiguration(),
			this.getCommunityLeaderBoard(),
			this.getCommunityOnlinePlayers(),
			this.getCommunityStats(),
			this.getCurrentPlayerStats(),
		])

		return {
			config: mapAppConfiguration(appConfiguration),
			community: {
				name: this.context.subredditName ?? 'REDDIBIRDS',
				you: youStats,
				leaderboard: leaderboard,
				online: activeCommunityPlayers,
				stats: communityStats,
			},
			// https://developers.reddit.com/docs/api/public-api/#-redisclient
			// https://discord.com/channels/1050224141732687912/1242689538447507458/1316043291401125888
			global: {
				name: 'REDDIBIRDS GLOBAL',
				leaderboard: [],
			},
		}
	}

	async savePlayerHighscore(score: number) {
		return this.redis.zAdd(`post:${this.subredditId}:highscores`, { member: this.userId, score })
	}
	async incrementPlayerAttemptsCount() {
		return this.redis.hIncrBy(`post:${this.subredditId}:attempts`, this.userId, 1)
	}

	async savePlayerStats(score: number) {
		return Promise.all([this.savePlayerHighscore(score), this.incrementPlayerAttemptsCount()])
	}

	async saveScore(stats: SaveScoreData) {
		const currentTopPlayer = await this.redis.zRange(`post:${this.subredditId}:highscores`, 0, 0, {
			by: 'rank',
			reverse: true,
		})

		await this.savePlayerStats(stats.highscore)
		await Promise.all([this.incrementCurrentCommunityScore(stats.score), this.incrementCurrentCommunityAttempts()])

		const newTopPlayer = await this.redis.zRange(`post:${this.subredditId}:highscores`, 0, 0, {
			by: 'rank',
			reverse: true,
		})

		if (!newTopPlayer || !newTopPlayer[0] || !this.postId) {
			return
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
	}

	async getCommunityLeaderBoard(limit: number = 10) {
		const communityLeaderboard = await this.redis.zRange(`post:${this.subredditId}:highscores`, 0, limit - 1, {
			by: 'rank',
			reverse: true,
		})

		const mappedLeaderboard = await Promise.all(
			communityLeaderboard.map(async ({ member, score }) => {
				const [userNameResponse, attempts] = await Promise.all([
					this.context.reddit.getUserById(member),
					this.redis.hGet(`post:${this.subredditId}:attempts`, member),
				])
				return {
					userId: member,
					userName: userNameResponse ? userNameResponse.username : 'Anonymous',
					score,
					attempts: Number(attempts ?? 0),
				}
			})
		)

		return mappedLeaderboard
	}

	async getCommunityOnlinePlayers() {
		const now = Date.now()

		await this.context.redis.hSet(ACTIVE_PLAYERS_HASH, { [this.userId]: now.toString() })

		const players = await this.context.redis.hGetAll(ACTIVE_PLAYERS_HASH)

		let onlinePlayersCount = 0
		const stalePlayers = []

		for (const [userId, timestamp] of Object.entries(players)) {
			if (now - parseInt(timestamp, 10) <= ACTIVE_PLAYER_TTL) {
				onlinePlayersCount += 1
			} else {
				stalePlayers.push(userId)
			}
		}

		if (stalePlayers.length > 0) {
			await this.context.redis.hDel(ACTIVE_PLAYERS_HASH, stalePlayers)
		}

		return onlinePlayersCount
	}

	async getCommunityStats() {
		const [communityScore, communityAttempts, topPlayerUsername] = await Promise.all([
			this.getCurrentCommunityScore(),
			this.getCurrentCommunityAttempts(),
			this.getCurrentCommunityHighScoreUsername(),
		])

		return {
			communityScore: Number(communityScore ?? 0),
			communityAttempts: Number(communityAttempts ?? 0),
			topPlayer: topPlayerUsername,
		}
	}

	/** COMMUNITY:USER */
	async getCurrentUserHighscore() {
		return this.redis.zScore(`post:${this.subredditId}:highscores`, this.userId)
	}

	async getCurrentUserAttempts() {
		return this.redis.hGet(`post:${this.subredditId}:attempts`, this.userId)
	}

	async getCurrentPlayerStats() {
		const [highscore, attempts] = await Promise.all([this.getCurrentUserHighscore(), this.getCurrentUserAttempts()])

		return {
			highscore: Number(highscore ?? 0),
			attempts: Number(attempts ?? 0),
		}
	}

	async getCurrentCommunityHighScoreUsername() {
		const currentTopPlayer = await this.getCurrentCommunityTopPlayerScore()

		if (currentTopPlayer.length < 1 || !currentTopPlayer[0]) return `???`
		const topPlayerUser = await this.context.reddit.getUserById(currentTopPlayer[0].member)
		if (!topPlayerUser) return `???`

		return topPlayerUser.username
	}

	/** COMMUNITY */
	async getAppConfiguration() {
		return this.context.settings.getAll<Record<'worldSelect' | 'playerSelect' | 'pipeSelect', any>>()
	}

	async incrementCurrentCommunityScore(score: number) {
		return this.redis.hIncrBy(`community:${this.context.subredditId}:score`, this.context.subredditId, score)
	}

	async incrementCurrentCommunityAttempts() {
		return this.redis.hIncrBy(`community:${this.context.subredditId}:attempts`, this.context.subredditId, 1)
	}

	async getCurrentCommunityScore() {
		return this.redis.hGet(`community:${this.context.subredditId}:score`, this.context.subredditId)
	}

	async getCurrentCommunityAttempts() {
		return this.redis.hGet(`community:${this.context.subredditId}:attempts`, this.context.subredditId)
	}

	async getCurrentCommunityTopPlayerScore() {
		return this.redis.zRange(`post:${this.subredditId}:highscores`, 0, 0, {
			by: 'rank',
			reverse: true,
		})
	}
}
