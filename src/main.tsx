import { Devvit, useState } from '@devvit/public-api'
Devvit.configure({
	redditAPI: true,
	redis: true,
	// realtime: true,
})

import './app/blocks/addAppSettings'
import './app/blocks/addMenuItem'
import './app/jobs/dailyJob'
import './app/jobs/firstFlapperComment'
import './app/jobs/newHighscoreComment'
import './app/jobs/welcomeUser'
import './app/triggers/daily'

import { SplashScreen } from './app/SplashScreen'
import { WebviewContainer } from './app/WebviewContainer'

Devvit.addCustomPostType({
	name: `Let's play Reddibirds!`,
	height: 'regular',
	render: (context: Devvit.Context) => {
		const [webviewVisible, setWebviewVisible] = useState(false)

		return (
			<vstack grow height="100%">
				{!webviewVisible && <SplashScreen context={context} setWebviewVisible={setWebviewVisible} />}
				{webviewVisible && <WebviewContainer context={context} />}
			</vstack>
		)
	},
})

export default Devvit
