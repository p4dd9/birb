import { Devvit, useInterval } from '@devvit/public-api'
import { devvitLogger } from '../shared/logger'
import type { PostMessageMessages, UpdateAppDataMessage } from '../shared/messages'

import { RedisService } from './redisService'

type WebviewContainerProps = {
	context: Devvit.Context
	webviewVisible: boolean
}

export function WebviewContainer(props: WebviewContainerProps): JSX.Element {
	const { webviewVisible, context } = props

	// TODO: errrww ...
	const redisService = new RedisService(context)

	const tickUpdateAppData = async () => {
		const appData = await redisService.getAppData()

		devvitLogger.info(`Sending 'updateAppData' postMessage (webviewcontainer)`)
		context.ui.webView.postMessage('game-webview', {
			type: 'updateAppData',
			data: appData,
		} as UpdateAppDataMessage)
	}
	useInterval(tickUpdateAppData, 10000).start()

	const handleMessage = async (ev: PostMessageMessages) => {
		devvitLogger.info('Received postMessage (webviewcontainer)' + ev.type)

		switch (ev.type) {
			case 'saveStats': {
				const newScore = ev.data.personal.highscore
				let currentPersonalStats = await redisService.getCurrentPlayerStats()

				if (!currentPersonalStats) {
					currentPersonalStats = { highscore: 0, attempts: 0, rank: null }

					if (!context.userId) return
					try {
						const username = (await context.reddit.getUserById(context.userId))?.username
						if (!username) return
						context.scheduler.runJob({
							name: 'USER_WELCOME_JOB',
							data: {
								username,
								score: newScore,
							},
							runAt: new Date(),
						})
					} catch (e) {
						devvitLogger.error(`Error sending user welcome job. ${e}`)
					}
				}

				const isNewHighScore = newScore > currentPersonalStats.highscore
				await redisService.saveScore({
					highscore: isNewHighScore ? newScore : currentPersonalStats.highscore,
					score: newScore,
					isNewHighScore,
				})
				if (isNewHighScore) {
					context.ui.showToast({ text: `Saved new personal Highscore ${newScore}!`, appearance: 'success' })
				}

				devvitLogger.info(`Sending 'gameOver' postMessage (webviewcontainer)`)
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

			case 'requestAppData': {
				const appData = await redisService.getAppData()

				devvitLogger.info(`Sending 'updateAppData' postMessage (webviewcontainer)`)
				context.ui.webView.postMessage('game-webview', {
					type: 'updateAppData',
					data: appData,
				} as UpdateAppDataMessage)

				break
			}

			default: {
				devvitLogger.info(`Unknown message type "${(ev as unknown as any).type}" !`)
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
