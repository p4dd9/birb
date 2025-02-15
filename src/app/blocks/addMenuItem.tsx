import { Devvit, type MenuItemOnPressEvent } from '@devvit/public-api'

const addMenuItem = async (_: MenuItemOnPressEvent, context: Devvit.Context) => {
	const { reddit, ui } = context
	const subreddit = await reddit.getCurrentSubreddit()
	await reddit.submitPost({
		title: `Let's play Birb!`,
		subredditName: subreddit.name,
		preview: (
			<vstack height="100%" width="100%" alignment="middle center">
				<text size="large">Loading ...</text>
			</vstack>
		),
	})
	ui.showToast({ text: 'Created post!' })
}

Devvit.addMenuItem({
	label: 'Create Birb Post',
	location: 'subreddit',
	forUserType: 'moderator',
	onPress: addMenuItem,
})

Devvit.addMenuItem({
	label: 'Run Supporter Flair Check Manually',
	location: 'subreddit',
	forUserType: 'moderator',
	onPress: (_e, context) => {
		context.scheduler.runJob({
			name: 'MANAGE_SUPPORTER_FLAIRS',
			runAt: new Date(Date.now() + 1000),
		})
	},
})

Devvit.addMenuItem({
	label: 'Start Supporter Flair 30d Job',
	location: 'subreddit',
	forUserType: 'moderator',
	onPress: (_e, context) => {
		context.scheduler.runJob({
			name: 'MANAGE_SUPPORTER_FLAIRS',
			cron: '0 0 * * *',
		})
	},
})
