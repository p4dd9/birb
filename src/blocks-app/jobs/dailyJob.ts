import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'

export const DAILY_KEY = 'current_challenge'
export const USER_COMPLETION_PREFIX = 'user_completion_'

export const DAILY_TTL = 24 * 60 * 60

export interface Challenge {
	title: string
	description: string
	reward: string
	points: number
}

Devvit.addSchedulerJob({
	name: 'reset_daily',
	onRun: async (_, context) => {
		const newChallenge: Challenge = {
			title: `Daily Quest`,
			description: 'Beat your highscore',
			reward: '50 community points!',
			points: 50,
		}

		await context.redis.set(DAILY_KEY, JSON.stringify(newChallenge))
		await context.redis.expire(DAILY_KEY, DAILY_TTL)

		devvitLogger.info('Daily reset with new data')
	},
})
