import { Devvit } from '@devvit/public-api'
import type { PostMessageMessages, UpdateGameSettingMessage } from '../shared/messages'
import { createRedisService } from './redisService'

type WebviewContainerProps = {
	context: Devvit.Context
	webviewVisible: boolean
}

export function WebviewContainer(props: WebviewContainerProps): JSX.Element {
	const { webviewVisible, context } = props
	const redisService = createRedisService(context)

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
			case 'getBestPlayer': {
				const bestPlayer = await redisService.getBestPlayer()
				if (!bestPlayer) return
				context.ui.webView.postMessage('game-webview', {
					type: 'updateBestPlayer',
					data: bestPlayer,
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
				const worldSelect = (await context.settings.get('world-select')) ?? null
				const playerSelect = (await context.settings.get('player-select')) ?? null
				const pipeSelect = (await context.settings.get('pipe-select')) ?? null

				const mappedWorldSelect = !Array.isArray(worldSelect) || !worldSelect[0] ? 'sunset' : worldSelect[0]
				const mappedPlayerFrame = !Array.isArray(playerSelect) ? 0 : Number(playerSelect[0])
				const mappedPipeFrame = !Array.isArray(pipeSelect) ? 0 : Number(pipeSelect[0])

				context.ui.webView.postMessage('game-webview', {
					type: 'changeWorld',
					data: {
						world: mappedWorldSelect,
						playerFrame: mappedPlayerFrame,
						pipeFrame: mappedPipeFrame,
					},
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
