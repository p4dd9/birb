import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'

export const firstSolveComment = Devvit.addSchedulerJob({
	name: 'SET_FLAIR',
	onRun: async (
		event: {
			data: {
				username: string
				subredditname: string
				sku: string
			}
		},
		context
	) => {
		if (event.data) {
			devvitLogger.info(JSON.stringify(event.data))
			try {
				await context.reddit.setUserFlair({
					subredditName: event.data.subredditname,
					username: event.data.username,
					text: 'Reddibird',
					backgroundColor: '#FFC0CB',
					textColor: 'dark',
					flairTemplateId: event.data.sku,
				})
				devvitLogger.info(
					`Handling Supporter Job-Purchase "SET_FLAIR" "${event.data.subredditname}" "${event.data.username}" ${event.data.sku}"`
				)
			} catch (error) {
				devvitLogger.error(
					`Handling Supporter Job-Purchase "SET_FLAIR" "${event.data.subredditname}" "${event.data.username}" ${event.data.sku}": ${error}`
				)
			}
		}
	},
})
