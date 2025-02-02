import { Devvit } from '@devvit/public-api'

export const SplashScreen = (props: SplashScreenProps) => {
	const { onPress, context } = props

	return (
		<zstack grow height="100%" width="100%" alignment="middle center">
			<zstack>
				<image
					url="splash-background-4.gif"
					height="100%"
					width="100%"
					imageWidth={`${context.dimensions?.width ?? 670}px`}
					imageHeight={`${context.dimensions?.height ?? 320}px`}
					resizeMode="cover"
				/>
			</zstack>
			<zstack>
				<button icon="play-fill" appearance="secondary" size="large" onPress={onPress}>
					PLAY GAME
				</button>
			</zstack>
		</zstack>
	)
}

type SplashScreenProps = {
	context: Devvit.Context
	onPress: () => void
}
