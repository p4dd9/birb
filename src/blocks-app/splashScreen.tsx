import { Devvit } from '@devvit/public-api'

type SplashScreenProps = {
	context: Devvit.Context
	webviewVisible: boolean
	setWebviewVisible: (visible: boolean) => void
}

export function SplashScreen(props: SplashScreenProps): JSX.Element {
	const { webviewVisible, setWebviewVisible } = props

	const onLaunchApp = () => {
		setWebviewVisible(true)
	}

	return (
		<zstack grow={!webviewVisible} height={webviewVisible ? '0%' : '100%'}>
			<vstack grow height="100%" width="100%" alignment="middle center">
				<image
					url="splash-background.png"
					height="100%"
					width="100%"
					imageWidth="1290px"
					imageHeight="258px"
					resizeMode="cover"
				/>
			</vstack>
			<vstack grow height="100%" width="100%" alignment="middle center">
				<button onPress={onLaunchApp}>Launch Game</button>
			</vstack>
		</zstack>
	)
}
