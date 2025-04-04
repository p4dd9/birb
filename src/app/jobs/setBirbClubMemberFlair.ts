import { Devvit } from '@devvit/public-api'
import { devvitLogger } from '../../shared/logger'
import { storePurchase } from '../services/purchaseService'

export type BIRB_CLUB_MEMBER_FLAIR_CHECK_JOB_PROPS = {
	subredditname: string
	username: string
	sku: string
	userid: string
}

export const setBirbClubMemberFlair = Devvit.addSchedulerJob<BIRB_CLUB_MEMBER_FLAIR_CHECK_JOB_PROPS>({
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
