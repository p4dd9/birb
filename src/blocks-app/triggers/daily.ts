import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'

Devvit.addTrigger({
	event: 'AppInstall',
	onEvent: async (_, context) => {
		devvitLogger.info('Setup trigger on "AppInstall" for job "reset_daily"')

		await context.scheduler.runJob({
			name: 'reset_daily',
			cron: '0 0 * * *',
			runAt: new Date(),
		})
	},
})
