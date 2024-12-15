import { Devvit } from '@devvit/public-api'

export const SplashScreen = (props: SplashScreenProps) => {
	const { setWebviewVisible, context } = props

	const onLaunchApp = (): any => {
		setWebviewVisible(true)
	}

	return (
		<zstack grow height="100%">
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

type SplashScreenProps = {
	context: Devvit.Context
	setWebviewVisible: (visible: boolean) => void
}
