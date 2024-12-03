import { Devvit, type MenuItemOnPressEvent } from '@devvit/public-api'

export async function addMenuItem(_: MenuItemOnPressEvent, context: Devvit.Context): Promise<void> {
	const { reddit, ui } = context
	const subreddit = await reddit.getCurrentSubreddit()
	await reddit.submitPost({
		title: 'REDDIBIRDS',
		subredditName: subreddit.name,
		// The preview appears while the post loads
		preview: (
			<vstack height="100%" width="100%" alignment="middle center">
				<text size="large">Loading ...</text>
			</vstack>
		),
	})
	ui.showToast({ text: 'Created post!' })
}
