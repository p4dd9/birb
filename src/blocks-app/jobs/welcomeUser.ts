import { Devvit } from '@devvit/public-api'

export const userWelcomeJob = Devvit.addSchedulerJob({
	name: 'USER_WELCOME_JOB',
	onRun: async (
		event: {
			data: {
				username: string
				score: number
			}
		},
		context
	) => {
		if (event.data) {
			const { username, score } = event.data
			try {
				context.reddit.sendPrivateMessage({
					to: username,
					subject: `Welcome to Reddibirds!`,
					text: `🎉 **You scored ${score} on your first Reddibirds run!** 🎉

                            Visit r/reddibirds for latest versions, updates and feedback!
                        `,
				})
			} catch (error) {
				console.error(`Failed to send USER_WELCOME_JOB welcome message to ${username}`, error)
			}
		}
	},
})
