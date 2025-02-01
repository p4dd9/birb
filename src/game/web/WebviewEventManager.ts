import { webviewLogger } from '../../shared/logger'
import type { SaveStatsMessage } from '../../shared/messages'
import globalEventEmitter from './GlobalEventEmitter'

export class WebviewEventManager {
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
				console.log(`MESSAGE: ${ev}`)
				const { type, data } = ev.data

				if (type !== WebviewEventManager.allowedMessageType) {
					webviewLogger.warn(`Received unknown event type ${type} (webviewEventManager)`)
					return
				}

				const { message } = data

				switch (message.type) {
					case 'gameOver': {
						globalEventEmitter.emit('gameOver', message.data)
						break
					}
					case 'updateAppData': {
						globalEventEmitter.emit('updateAppData', message.data)
						break
					}
					default: {
						webviewLogger.warn(`Unknown type ${message.type} for message ${message}.`)
					}
				}
			},
			false
		)
	}

	static registerGameInternalEvents() {
		globalEventEmitter.on('saveStats', (highscore: number) => {
			let message: SaveStatsMessage = {
				type: 'saveStats',
				data: {
					personal: { highscore },
				},
			}
			WebviewEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('getBestPlayers', () => {
			let message: { type: string } = {
				type: 'getBestPlayers',
			}
			WebviewEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('requestAppData', () => {
			let message: { type: string } = {
				type: 'requestAppData',
			}
			WebviewEventManager.postMessageToParent(message)
		})
	}

	static postMessageToParent(message: any) {
		if (!window.parent) {
			webviewLogger.warn(
				`App is not running in an embedded webview. Cannot send postMessage to "${WebviewEventManager.targetOrigin}".`
			)
		}
		window.parent.postMessage(message, WebviewEventManager.targetOrigin)
	}
}
