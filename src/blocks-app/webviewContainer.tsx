import { Devvit, useAsync, useChannel, useInterval } from '@devvit/public-api'
import { ChannelStatus } from '@devvit/public-api/types/realtime'
import { devvitLogger } from '../shared/logger'
import type { PostMessageMessages, UpdateAppDataMessage, UpdateOnlinePlayersMessage } from '../shared/messages'
import './jobs/firstFlapperComment'
import './jobs/newHighscoreComment'
import './jobs/welcomeUser'
import { RedisService } from './redisService'

type WebviewContainerProps = {
	context: Devvit.Context
	webviewVisible: boolean
}

export function WebviewContainer(props: WebviewContainerProps): JSX.Element {
	const { webviewVisible, context } = props
	const redisService = new RedisService(context)

	const emitUserPlaying = async () => {
		const count = await redisService.getCommunityOnlinePlayers()
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
			if (!webviewVisible) {
				emitUserPlaying()
			}
			return null
		},
		{ depends: [webviewVisible] }
	)

	const handleMessage = async (ev: PostMessageMessages) => {
		devvitLogger.info('Received postMessage (webviewcontainer)' + ev.type)

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

			case 'getBestPlayers': {
				const bestPlayers = await redisService.getCommunityLeaderBoard()
				if (!bestPlayers || bestPlayers.length < 0) return

				devvitLogger.info(`Sending 'updateBestPlayers' postMessage (webviewcontainer)`)
				context.ui.webView.postMessage('game-webview', {
					type: 'updateBestPlayers',
					data: bestPlayers,
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
