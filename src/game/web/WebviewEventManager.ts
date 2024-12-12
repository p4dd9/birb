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
				const { type, data } = ev.data

				if (type !== WebviewEventManager.allowedMessageType) {
					webviewLogger.warn(`Received unknown event type ${type} (webviewEventManager)`)
					return
				}

				const { message } = data
				webviewLogger.info(`Received postMessage ${message.type} (webviewEventManager)`)

				switch (message.type) {
					case 'gameOver': {
						globalEventEmitter.emit('gameOver', message.data)
						break
					}
					case 'updateAppData': {
						webviewLogger.info(JSON.stringify(message.data))
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
		webviewLogger.info('Register Internal Eventlisteners')

		globalEventEmitter.on('saveStats', (highscore: number) => {
			webviewLogger.info('saveStats')
			let message: SaveStatsMessage = {
				type: 'saveStats',
				data: {
					personal: { highscore },
				},
			}
			WebviewEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('getBestPlayers', () => {
			webviewLogger.info('getBestPlayers')
			let message: { type: string } = {
				type: 'getBestPlayers',
			}
			WebviewEventManager.postMessageToParent(message)
		})

		globalEventEmitter.on('requestAppData', () => {
			webviewLogger.info('requestAppData')
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
