import { Devvit, useAsync } from '@devvit/public-api'
import type { PostMessageMessages, UpdateGameSettingMessage } from '../shared/messages'
import { mappAppSettingsToMessage } from './redisMapper'
import { createRedisService } from './redisService'

type WebviewContainerProps = {
	context: Devvit.Context
	webviewVisible: boolean
}

export function WebviewContainer(props: WebviewContainerProps): JSX.Element {
	const { webviewVisible, context } = props
	const redisService = createRedisService(context)

	useAsync(
		async () => {
			if (webviewVisible) {
				const appSettings = await redisService.getAppSettings()
				const mappedMessage = mappAppSettingsToMessage(appSettings)
				context.ui.webView.postMessage('game-webview', {
					type: 'changeWorld',
					data: mappedMessage,
				} as UpdateGameSettingMessage)
			}
			return null
		},
		{ depends: [webviewVisible] }
	)

	const handleMessage = async (ev: PostMessageMessages) => {
		console.log('Received message', ev)

		switch (ev.type) {
			case 'saveStats': {
				const newScore = ev.data.personal.highscore
				let currentPersonalStats = await redisService.getPlayerStats()

				if (!currentPersonalStats) {
					currentPersonalStats = { highscore: 0, attempts: 0 }
				}

				const isNewHighScore = newScore > currentPersonalStats.highscore
				await redisService.saveScore({
					highscore: isNewHighScore ? newScore : currentPersonalStats.highscore,
				})

				if (isNewHighScore) {
					context.ui.showToast({ text: `Saved new Highscore ${newScore}!`, appearance: 'success' })
				}

				context.ui.webView.postMessage('game-webview', {
					type: 'gameOver',
					data: {
						isNewHighScore,
						newScore,
						highscore: isNewHighScore ? newScore : currentPersonalStats.highscore,
						attempts: currentPersonalStats.attempts + 1,
					},
				})
				break
			}

			case 'getBestPlayers': {
				const bestPlayers = await redisService.getTopPlayers()
				if (!bestPlayers || bestPlayers.length < 0) return
				context.ui.webView.postMessage('game-webview', {
					type: 'updateBestPlayers',
					data: bestPlayers,
				})
				break
			}

			case 'requestAppSettings': {
				const appSettings = await redisService.getAppSettings()
				const mappedMessage = mappAppSettingsToMessage(appSettings)

				context.ui.webView.postMessage('game-webview', {
					type: 'changeWorld',
					data: mappedMessage,
				} as UpdateGameSettingMessage)

				break
			}
			default: {
				console.log(`Unknown message type "${(ev as unknown as any).type}" !`)
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
				onMessage={(msg) => handleMessage(msg as PostMessageMessages)}
			/>
		</vstack>
	)
}
