import { Devvit, useState } from '@devvit/public-api'
import { addMenuItem } from './blocks-app/addMenuItem'
import { SplashScreen } from './blocks-app/splashScreen'
import { WebviewContainer } from './blocks-app/webviewContainer'
import { PipeSelect } from './settings/pipe.select'
import { PlayerSelect } from './settings/player.select'
import { WorldSelect } from './settings/world.select'

Devvit.configure({
	redditAPI: true,
	redis: true,
})

Devvit.addMenuItem({
	label: 'Create REDDIBIRDS Post',
	location: 'subreddit',
	forUserType: 'moderator',
	onPress: addMenuItem,
})

Devvit.addSettings([PlayerSelect, WorldSelect, PipeSelect])

Devvit.addSettings([
	{
		type: 'group',
		label: 'Reddibirds Theme Customization',
		fields: [WorldSelect, PipeSelect, PlayerSelect],
		helpText:
			'The settings will change the appearance of the Game in your Community. Takes effect when a reddit user loads the game.',
	},
])

/**Devvit.addTrigger({
	event: 'AppUpgrade',
	onEvent: async (event, context) => {
		console.log(await context.settings.getAll())
	},
})**/

Devvit.addCustomPostType({
	name: 'REDDIBIRDS',
	height: 'regular',
	render: (context: Devvit.Context) => {
		const [webviewVisible, setWebviewVisible] = useState(false)

		return (
			<vstack grow height="100%">
				<SplashScreen context={context} webviewVisible={webviewVisible} setWebviewVisible={setWebviewVisible} />
				<WebviewContainer context={context} webviewVisible={webviewVisible} />
			</vstack>
		)
	},
})

export default Devvit
