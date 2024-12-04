import type { Player, SaveStatsMessage } from '../../shared/messages'
import globalEventEmitter from './GlobalEventEmitter'

export class PostMessageEventManager {
	static allowedOrigins = ['https://www.reddit.com']
	static allowedMessageType = 'devvit-message'

	static targetOrigin = 'https://www.reddit.com'
	static targetEmbeddedWebviewId = 'game-webview'

	static registerEvents() {
		PostMessageEventManager.registerOnMessage()
		PostMessageEventManager.registerInternalEvents()
	}

	static registerOnMessage() {
		window.addEventListener(
			'message',
			(ev) => {
				const { type, data } = ev.data
				if (
					!PostMessageEventManager.allowedOrigins.includes(ev.origin) ||
					type !== PostMessageEventManager.allowedMessageType
				) {
					return
				}
				console.log(ev)

				switch (data.message.type) {
					case 'gameOver': {
						const gameOverData = data.message.data as {
							isNewHighScore: boolean
							newScore: number
							highscore: number
							attempts: number
						}
						globalEventEmitter.emit('gameOver', gameOverData)
						break
					}
					case 'updateBestPlayer': {
						const gameOverData = data.message.data as Player
						globalEventEmitter.emit('updateBestPlayer', gameOverData)
						break
					}
					case 'updateBestPlayers': {
						const gameOverData = data.message.data as Player[]
						globalEventEmitter.emit('updateBestPlayers', gameOverData)
						break
					}
					case 'changeBackground': {
						const backgroundKey = data.message.data as string
						const body = document.body
						if (body) {
							body.style.background = `url('/assets/bg/${backgroundKey}.png') repeat-x / 100vh`
						}
						break
					}
					default: {
						console.log(`Unknown type ${data.message.type} for message ${data.message}.`)
					}
				}
			},
			false
		)
	}

	static registerInternalEvents() {
		globalEventEmitter.on('saveStats', (highscore: number) => {
			let message: SaveStatsMessage = {
				type: 'saveStats',
				data: {
					personal: { highscore },
				},
			}
			PostMessageEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('getBestPlayer', () => {
			let message: { type: string } = {
				type: 'getBestPlayer',
			}
			PostMessageEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('getBestPlayers', () => {
			let message: { type: string } = {
				type: 'getBestPlayers',
			}
			PostMessageEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('requestBackgroundChange', () => {
			let message: { type: string } = {
				type: 'requestBackgroundChange',
			}
			PostMessageEventManager.postMessageToParent(message)
		})
	}

	static postMessageToParent(message: any) {
		window.parent?.postMessage(message, PostMessageEventManager.targetOrigin)
	}
}
