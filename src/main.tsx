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
	realtime: true,
})

import './blocks-app/jobs/dailyJob'
import './blocks-app/jobs/firstFlapperComment'
import './blocks-app/jobs/newHighscoreComment'
import './blocks-app/jobs/welcomeUser'

import './blocks-app/triggers/daily'

Devvit.addMenuItem({
	label: 'Create Reddibirds Game',
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

Devvit.addCustomPostType({
	name: `Let's play Reddibirds!`,
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
