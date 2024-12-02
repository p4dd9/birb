import { Devvit, useState } from '@devvit/public-api'
import { createRedisService, type SaveScoreData } from './redisService'

type SplashScreenProps = {
	context: Devvit.Context
	webviewVisible: boolean
	setWebviewVisible: (visible: boolean) => void
}

export function SplashScreen(props: SplashScreenProps): JSX.Element {
	const { context, webviewVisible, setWebviewVisible } = props
	const redisService = createRedisService(props.context)
	const [stats] = useState<SaveScoreData | null>(async () => await redisService.getPlayerStats())

	const onLaunchApp = () => {
		setWebviewVisible(true)
	}

	return (
		<zstack grow={!webviewVisible} height={webviewVisible ? '0%' : '100%'}>
			<image
				url="splash-background.png"
				height="100%"
				width="100%"
				imageWidth="1290px"
				imageHeight="258px"
				minWidth="1290px"
				minHeight="258px"
				resizeMode="cover"
			/>
			<vstack grow height="100%" width="100%" alignment="middle center">
				<button onPress={onLaunchApp}>Launch ReddiBirds</button>
			</vstack>
		</zstack>
	)
}
