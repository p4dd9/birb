import { Devvit, useState } from '@devvit/public-api'
Devvit.configure({
	redditAPI: true,
	redis: true,
	// realtime: true,
})

import './blocks/addAppSettings'
import './blocks/addMenuItem'
import './jobs/dailyJob'
import './jobs/firstFlapperComment'
import './jobs/newHighscoreComment'
import './jobs/welcomeUser'
import './triggers/daily'

import { SplashScreen } from './SplashScreen'
import { WebviewContainer } from './WebviewContainer'

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
