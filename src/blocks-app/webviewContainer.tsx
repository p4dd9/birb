import { Devvit } from '@devvit/public-api'
import type { SaveStatsMessage } from '../shared/messages'
import { createRedisService } from './redisService'

type WebviewContainerProps = {
	context: Devvit.Context
	webviewVisible: boolean
}

export function WebviewContainer(props: WebviewContainerProps): JSX.Element {
	const { webviewVisible, context } = props
	const redisService = createRedisService(context)

	const handleMessage = async (ev: SaveStatsMessage) => {
		console.log('Received message', ev)
		if (ev.type === 'saveStats') {
			await redisService.saveStats({ wins: ev.data.wins, losses: ev.data.losses })
			context.ui.showToast({ text: 'Stats saved to Redis!' })
		}
	}

	return (
		<vstack grow={webviewVisible} height={webviewVisible ? '100%' : '0px'}>
			<webview
				id="game-webview"
				url="index.html"
				grow
				width="100%"
				minWidth="100%"
				onMessage={(msg) => handleMessage(msg as SaveStatsMessage)}
			/>
		</vstack>
	)
}
