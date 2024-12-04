import { Devvit, useState } from '@devvit/public-api'
import { addMenuItem } from './blocks-app/addMenuItem'
import { SplashScreen } from './blocks-app/splashScreen'
import { WebviewContainer } from './blocks-app/webviewContainer'
import { PipeSelect } from './settings/pipe.select'
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

Devvit.addSettings([WorldSelect, PipeSelect])

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
