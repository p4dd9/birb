import { Devvit, RichTextBuilder } from '@devvit/public-api'
import type { PostMessageMessages } from '../shared/messages'
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

			case 'shareAsComment': {
				if (!context.postId) {
					return
				}
				const currentUser = await context.reddit.getCurrentUser()
				if (!currentUser?.id) {
					return
				}
				const playerStats = await redisService.getPlayerByUserId(currentUser.id)
				if (!playerStats) {
					return
				}

				try {
					const comment = await context.reddit.submitComment({
						id: context.postId,
						richtext: new RichTextBuilder().codeBlock({}, (cb) =>
							cb.rawText(`"${currentUser.username}"s highscore is ${playerStats.highscore}!`)
						),
					})

					if (comment) {
						context.ui.showToast('Your fantastic highscore was shared as a comment!')
					}
				} catch (err) {
					throw new Error(`Error uploading media: ${err}`)
				}
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
