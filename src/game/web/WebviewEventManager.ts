import type { RedisPlayer, SaveStatsMessage, WorldSetting } from '../../shared/messages'
import { addDebugMsg } from '../debug'
import globalEventEmitter from './GlobalEventEmitter'

export class WebviewEventManager {
	// static allowedOrigins = ['https://www.reddit.com']
	static allowedMessageType = 'devvit-message'

	static targetOrigin = '*'
	static targetEmbeddedWebviewId = 'game-webview'

	static registerEvents() {
		WebviewEventManager.registerGameInternalEvents()
		WebviewEventManager.registerPostMessageListeners()
	}

	static registerPostMessageListeners() {
		window.addEventListener(
			'message',
			(ev) => {
				const { type, data } = ev.data
				addDebugMsg(JSON.stringify(data))

				if (type !== WebviewEventManager.allowedMessageType) {
					return
				}

				const { message } = data

				switch (message.type) {
					case 'gameOver': {
						const gameOverData = message.data as {
							isNewHighScore: boolean
							newScore: number
							highscore: number
							attempts: number
						}
						globalEventEmitter.emit('gameOver', gameOverData)
						break
					}
					case 'updateBestPlayers': {
						const gameOverData = message.data as RedisPlayer[]
						globalEventEmitter.emit('updateBestPlayers', gameOverData)
						break
					}
					case 'updateOnlinePlayers': {
						const playersCountData = message.data as { count: number }
						globalEventEmitter.emit('updateOnlinePlayers', playersCountData)
						break
					}
					case 'changeWorld': {
						const worldSetting = message.data as WorldSetting
						const canvasParent = document.getElementById('game-container')
						if (canvasParent && canvasParent instanceof HTMLDivElement) {
							// BUG/WEIRD: unreliable pixel dimension on window and body element in webviews, most likely as there are some resizing events fired (idk rly)
							// ISSUE not showing repeating bg: body.style.background = `url('/assets/bg/${worldSetting.world}.png') 0% 0% / auto 320px repeat-x`
							//
							// these values evaluate to random numbers at some point, 0px in height,
							// addDebugMsg(`innerHeight: ${window.innerHeight}px`)
							// addDebugMsg(`innerWidth: ${window.innerWidth}px`)

							// WORKAROUND: create a new canvas parent or use the canvas directly, centered and set the fixed height based on dimension (regular vs tall)
							canvasParent.style.background = `url('/assets/bg/${worldSetting.world}.png') center / auto 320px repeat-x`
						}

						globalEventEmitter.emit('changeWorld', worldSetting)
						break
					}
					default: {
						console.log(`Unknown type ${message.type} for message ${message}.`)
					}
				}
			},
			false
		)
	}

	static registerGameInternalEvents() {
		console.log('registerGameInternalEvents')
		globalEventEmitter.on('saveStats', (highscore: number) => {
			console.log('saveStats')
			let message: SaveStatsMessage = {
				type: 'saveStats',
				data: {
					personal: { highscore },
				},
			}
			WebviewEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('getBestPlayers', () => {
			console.log('getBestPlayers')
			let message: { type: string } = {
				type: 'getBestPlayers',
			}
			WebviewEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('requestAppSettings', () => {
			console.log('requestAppSettings')
			let message: { type: string } = {
				type: 'requestAppSettings',
			}
			WebviewEventManager.postMessageToParent(message)
		})
	}

	static postMessageToParent(message: any) {
		if (!window.parent) {
			console.warn(`App is not running in an embedded webview.`)
		}
		window.parent.postMessage(message, WebviewEventManager.targetOrigin)
	}
}
