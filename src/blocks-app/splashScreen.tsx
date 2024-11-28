import { Devvit, useState } from '@devvit/public-api'
import { createRedisService } from './redisService'
import type { Stats } from '../shared/types'
import type { StartGameMessage } from '../shared/messages'

type SplashScreenProps = {
	context: Devvit.Context
	webviewVisible: boolean
	setWebviewVisible: (visible: boolean) => void
}

export function SplashScreen(props: SplashScreenProps): JSX.Element {
	const { context, webviewVisible, setWebviewVisible } = props
	const redisService = createRedisService(props.context)
	const [stats] = useState<Stats>(async () => await redisService.getStats())

	const onLaunchApp = () => {
		setWebviewVisible(true)
		const message: StartGameMessage = { type: 'startGame', data: stats }
		context.ui.webView.postMessage('game-webview', message)
	}

	return (
		<zstack grow={!webviewVisible} height={webviewVisible ? '0%' : '100%'}>
			<image
				url="splash-background.png"
				width="100%"
				height="100%"
				imageWidth="718px"
				imageHeight="320px"
				resizeMode="fill"
			/>
			<vstack grow height="100%" width="100%" alignment="middle center">
				<text size="xlarge" weight="bold" color="white">
					ReddiBirds
				</text>
				<spacer />
				<spacer />
				<button onPress={onLaunchApp}>Launch App</button>
			</vstack>
		</zstack>
	)
}
