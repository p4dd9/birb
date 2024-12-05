import type { Player, SaveStatsMessage } from '../../shared/messages'
import { addDebugMsg } from '../debug'
import globalEventEmitter from './GlobalEventEmitter'

export class PostMessageEventManager {
	static allowedOrigins = ['https://www.reddit.com']
	static allowedMessageType = 'devvit-message'

	static targetOrigin = '*'
	static targetEmbeddedWebviewId = 'game-webview'

	static registerEvents() {
		PostMessageEventManager.registerInternalEvents()
		PostMessageEventManager.registerOnMessage()
	}

	static registerOnMessage() {
		window.addEventListener(
			'message',
			(ev) => {
				const { type, data } = ev.data
				if (type !== PostMessageEventManager.allowedMessageType) {
					return
				}
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
						addDebugMsg(body.style.background)
						if (body) {
							body.style.background = `url('/assets/bg/${backgroundKey}.png')`
							body.style.backgroundRepeat = `repeat-x`
							body.style.backgroundSize = `100vh`

							addDebugMsg(body.style.background)
						} else {
							addDebugMsg('body not found')
						}
						break
					}
					case 'changePipeFrame': {
						const pipeFrame = data.message.data as number
						addDebugMsg(pipeFrame.toString())

						globalEventEmitter.emit('changePipeFrame', pipeFrame)
						break
					}

					case 'changePlayerFrame': {
						const playerFrame = data.message.data as number
						globalEventEmitter.emit('changePlayerFrame', playerFrame)
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
		console.log('registerEvents')
		globalEventEmitter.on('saveStats', (highscore: number) => {
			console.log('saveStats')
			let message: SaveStatsMessage = {
				type: 'saveStats',
				data: {
					personal: { highscore },
				},
			}
			PostMessageEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('getBestPlayer', () => {
			console.log('getBestPlayer')
			let message: { type: string } = {
				type: 'getBestPlayer',
			}
			PostMessageEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('getBestPlayers', () => {
			console.log('getBestPlayers')
			let message: { type: string } = {
				type: 'getBestPlayers',
			}
			PostMessageEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('requestAppSettings', () => {
			console.log('requestAppSettings')
			let message: { type: string } = {
				type: 'requestAppSettings',
			}
			PostMessageEventManager.postMessageToParent(message)
		})
	}

	static postMessageToParent(message: any) {
		window.parent?.postMessage(message, PostMessageEventManager.targetOrigin)
	}
}
