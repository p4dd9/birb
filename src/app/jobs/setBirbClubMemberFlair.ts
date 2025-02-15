import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'
import { storePurchase } from '../services/purchaseService'

export const setBirbClubMemberFlair = Devvit.addSchedulerJob({
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
						backgroundColor: '#FE9A14',
						text: 'Birb Club Member',
						textColor: 'dark',
					}),
				])

				devvitLogger.info(
					`Handling membership Job-Purchase "SET_FLAIR" "${subredditname}" "${username}" ${sku}".`
				)
			} catch (error) {
				devvitLogger.error(
					`Handling membership Job-Purchase "SET_FLAIR" "${subredditname}" "${username}" ${sku}": ${error}.`
				)
			}
		}
	},
})
