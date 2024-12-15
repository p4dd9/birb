import { Devvit, useState } from '@devvit/public-api'
import { addMenuItem } from './app/blocks/addMenuItem'
import { PipeSelect } from './app/settings/pipe.select'
import { PlayerSelect } from './app/settings/player.select'
import { WorldSelect } from './app/settings/world.select'
Devvit.configure({
	redditAPI: true,
	redis: true,
	realtime: true,
})

import './app/jobs/dailyJob'
import './app/jobs/firstFlapperComment'
import './app/jobs/newHighscoreComment'
import './app/jobs/welcomeUser'

import { SplashScreen } from './app/SplashScreen'
import './app/triggers/daily'
import { WebviewContainer } from './app/WebviewContainer'

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
				{webviewVisible && <WebviewContainer context={context} />}
			</vstack>
		)
	},
})

export default Devvit
