import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'
import { storePurchase } from '../services/purchaseService'

export const setSupporterFlair = Devvit.addSchedulerJob({
	name: 'SET_FLAIR',
	onRun: async (
		event: {
			data: {
				userid: string
				username: string
				subredditname: string
				sku: string
			}
		},
		context
	) => {
		if (event.data) {
			const { subredditname, username, sku, userid } = event.data
			try {
				devvitLogger.info(`Starting to set flair for user ${username} with sku ${sku}.`)
				await Promise.all([
					storePurchase(context, userid),
					context.reddit.setUserFlair({
						subredditName: subredditname,
						username: username,
						flairTemplateId: 'eba02e00-e159-11ef-8328-425855bb6f79',
					}),
				])

				devvitLogger.info(
					`Handling Supporter Job-Purchase "SET_FLAIR" "${subredditname}" "${username}" ${sku}".`
				)
			} catch (error) {
				devvitLogger.error(
					`Handling Supporter Job-Purchase "SET_FLAIR" "${subredditname}" "${username}" ${sku}": ${error}.`
				)
			}
		}
	},
})
