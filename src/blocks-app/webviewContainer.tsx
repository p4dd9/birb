import { Devvit, useAsync, useChannel, useInterval } from '@devvit/public-api'
import { ChannelStatus } from '@devvit/public-api/types/realtime'
import type { PostMessageMessages, UpdateGameSettingMessage, UpdateOnlinePlayersMessage } from '../shared/messages'
import './jobs/firstFlapperComment'
import './jobs/newHighscoreComment'
import './jobs/welcomeUser'
import { logger } from './log/logger'
import { mappAppSettingsToMessage } from './redisMapper'
import { createRedisService } from './redisService'

type WebviewContainerProps = {
	context: Devvit.Context
	webviewVisible: boolean
}

export function WebviewContainer(props: WebviewContainerProps): JSX.Element {
	const { webviewVisible, context } = props
	const redisService = createRedisService(context)

	const emitUserPlaying = async () => {
		const count = (await redisService.saveUserInteraction()) ?? 0
		if (onlinePlayersChannel.status === ChannelStatus.Connected) {
			onlinePlayersChannel.send({ type: 'updateOnlinePlayers', count: count })
		}
	}
	useInterval(emitUserPlaying, 10000).start()

	const onlinePlayersChannel = useChannel({
		name: 'online_player',
		onMessage: (data: { type: string; count: number }) => {
			if (data.type === 'updateOnlinePlayers') {
				context.ui.webView.postMessage('game-webview', {
					type: 'updateOnlinePlayers',
					data: { count: data.count },
				} as UpdateOnlinePlayersMessage)
			}
		},
	})

	useAsync(
		async () => {
			if (webviewVisible) {
				const appSettings = await redisService.getAppSettings()
				const mappedMessage = mappAppSettingsToMessage(appSettings)
				context.ui.webView.postMessage('game-webview', {
					type: 'changeWorld',
					data: mappedMessage,
				} as UpdateGameSettingMessage)
			} else {
				emitUserPlaying()
			}
			return null
		},
		{ depends: [webviewVisible] }
	)

	const handleMessage = async (ev: PostMessageMessages) => {
		logger.info('Received postMessage (webviewcontainer)', ev)

		switch (ev.type) {
			case 'saveStats': {
				const newScore = ev.data.personal.highscore
				let currentPersonalStats = await redisService.getPlayerStats()

				if (!currentPersonalStats) {
					currentPersonalStats = { highscore: 0, attempts: 0 }

					if (!context.userId) return
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
				}

				const isNewHighScore = newScore > currentPersonalStats.highscore
				await redisService.saveScore({
					highscore: isNewHighScore ? newScore : currentPersonalStats.highscore,
					score: newScore,
				})
				if (isNewHighScore) {
					context.ui.showToast({ text: `Saved new Highscore ${newScore}!`, appearance: 'success' })
				}

				logger.info(`Sending 'gameOver' postMessage (webviewcontainer)`)
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

				logger.info(`Sending 'updateBestPlayers' postMessage (webviewcontainer)`)
				context.ui.webView.postMessage('game-webview', {
					type: 'updateBestPlayers',
					data: bestPlayers,
				})
				break
			}

			case 'requestAppSettings': {
				const appSettings = await redisService.getAppSettings()
				const mappedMessage = mappAppSettingsToMessage(appSettings)

				logger.info(`Sending 'requestAppSettings' postMessage (webviewcontainer)`)
				context.ui.webView.postMessage('game-webview', {
					type: 'changeWorld',
					data: mappedMessage,
				} as UpdateGameSettingMessage)

				break
			}
			default: {
				logger.info(`Unknown message type "${(ev as unknown as any).type}" !`)
			}
		}
	}

	onlinePlayersChannel.subscribe()

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
