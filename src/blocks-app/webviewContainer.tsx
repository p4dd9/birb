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
			const newScore = ev.data.personal.highscore
			let currentPersonalStats = await redisService.getPersonalStats()

			if (!currentPersonalStats) {
				currentPersonalStats = { gameRounds: 0, highscore: 0 }
			}

			const isNewHighScore = newScore > currentPersonalStats.highscore
			await redisService.savePersonalStats({
				highscore: isNewHighScore ? newScore : currentPersonalStats.highscore,
				gameRounds: currentPersonalStats.gameRounds + 1,
			})

			context.ui.webView.postMessage('game-webview', { newScore })
			if (isNewHighScore) {
				context.ui.showToast({ text: `Saved new Highscore ${newScore}!`, appearance: 'success' })
			}
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
