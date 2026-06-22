import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'
import { DAILY, DAILY_KEY, DAILY_TTL } from '../config/daily.config'

Devvit.addTrigger({
	event: 'AppInstall',
	onEvent: async (_, context) => {
		devvitLogger.info('Setup trigger on "AppInstall" for job "reset_daily" and cancel all existing jobs.')

		await context.redis.set(DAILY_KEY, JSON.stringify(DAILY))
		await context.redis.expire(DAILY_KEY, DAILY_TTL)

		devvitLogger.info('Daily reset with new data')

		const existingJobs = await context.scheduler.listJobs()

		if (existingJobs && existingJobs.length) {
			for (const job of existingJobs) {
				try {
					devvitLogger.info(`Canceled job "${job.id}":"${job.name}".`)
					await context.scheduler.cancelJob(job.id)
				} catch (e) {
					devvitLogger.error(`Erro canceling job "${job.id}":"${job.name}". ${e}`)
				}
			}
		} else {
			devvitLogger.info(`No existing jobs`)
		}

		await context.scheduler.runJob({
			name: 'reset_daily',
			cron: '0 0 * * *',
			runAt: new Date(),
		})
	},
})
