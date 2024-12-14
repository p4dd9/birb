import { Devvit } from '@devvit/public-api'

export const firstFlapperCommentJob = Devvit.addSchedulerJob({
	name: 'FIRST_FLAPPER_COMMENT',
	onRun: async (
		event: {
			data: {
				postId: string
				username: string
				score: number
			}
		},
		context
	) => {
		if (event.data) {
			const { username, score, postId } = event.data
			try {
				const comment = await context.reddit.submitComment({
					id: postId,
					text: `The early bird flaps to #1. u/${username} was the first to score with ${score} points!`,
				})
				comment.distinguish(true)
			} catch (error) {
				console.error(`Failed to send comment FIRST_FLAPPER_COMMENT message to ${username}`, error)
			}
		}
	},
})
