import { Devvit } from '@devvit/public-api'

export const newHighscoreComment = Devvit.addSchedulerJob({
	name: 'NEW_HIGHSCORE_COMMENT',
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
					text: `u/${username} has taken the lead with ${score} points!`,
				})
				comment.distinguish(true)
			} catch (error) {
				console.error(`Failed to send comment NEW_HIGHSCORE_COMMENT message to ${username}`, error)
			}
		}
	},
})
