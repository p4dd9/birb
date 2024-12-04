import { Devvit, useState } from '@devvit/public-api'
import { addMenuItem } from './blocks-app/addMenuItem'
import { SplashScreen } from './blocks-app/splashScreen'
import { WebviewContainer } from './blocks-app/webviewContainer'

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

Devvit.addSettings([
	{
		type: 'select',
		name: 'world-select',
		label: 'Select World (This will change the background appearance within Reddibirds)',
		options: [
			{
				label: 'Sunset',
				value: 'sunset',
			},
			{
				label: 'Daylight',
				value: 'daylight',
			},
			{
				label: 'Evening',
				value: 'evenging',
			},
			{
				label: 'Night',
				value: 'night',
			},
			{
				label: 'Midnight',
				value: 'midnight',
			},
		],
		multiSelect: false,
		defaultValue: ['sunset'],
	},
])

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
