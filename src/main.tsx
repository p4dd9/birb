import { Devvit, useState } from '@devvit/public-api'
import { addMenuItem } from './blocks-app/addMenuItem'
import { SplashScreen } from './blocks-app/splashScreen'
import { WebviewContainer } from './blocks-app/webviewContainer'

Devvit.configure({
	redditAPI: true, // username
	redis: true, // db storage
})

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
	label: 'Untitled Game with PhaserJS',
	location: 'subreddit',
	forUserType: 'moderator',
	onPress: addMenuItem,
})

// Add a post type definition
Devvit.addCustomPostType({
	name: 'Untitled Game with PhaserJS',
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
