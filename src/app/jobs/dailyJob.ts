import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'
import { DAILY, DAILY_KEY, DAILY_TTL } from '../config/daily.config'

Devvit.addSchedulerJob({
	name: 'reset_daily',
	onRun: async (_, context) => {
		await context.redis.set(DAILY_KEY, JSON.stringify(DAILY))
		await context.redis.expire(DAILY_KEY, DAILY_TTL)

		devvitLogger.info('Daily reset with new data')
	},
})
