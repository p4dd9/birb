import { Devvit } from '@devvit/public-api'

type SplashScreenProps = {
	context: Devvit.Context
	webviewVisible: boolean
	setWebviewVisible: (visible: boolean) => void
}

export const SplashScreen = (props: SplashScreenProps) => {
	const { webviewVisible, setWebviewVisible, context } = props

	const onLaunchApp = () => {
		setWebviewVisible(true)
	}

	return (
		<zstack grow={!webviewVisible} height={webviewVisible ? '0%' : '100%'}>
			<vstack grow height="100%" width="100%" alignment="middle center">
				<image
					url="splash-background-4.gif"
					height="100%"
					width="100%"
					imageWidth={`${context.dimensions!.width}px`}
					imageHeight={`${context.dimensions!.height}px`}
					resizeMode="cover"
				/>
			</vstack>
			<vstack grow height="100%" width="100%" alignment="middle center">
				<button icon="play-fill" appearance="secondary" size="large" onPress={onLaunchApp}>
					PLAY GAME
				</button>
			</vstack>
		</zstack>
	)
}
