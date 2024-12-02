import type { SaveStatsMessage } from '../../shared/messages'
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

				switch (data.message.type) {
					case 'gameOver': {
						const gameOverData = data.message.data as { isNewHighscore: boolean; newScore: number }
						globalEventEmitter.emit('gameOver', gameOverData)
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
			PostMessageEventManager.postMessage(message)
		})
	}

	static postMessage(message: any) {
		window.parent?.postMessage(message, PostMessageEventManager.targetOrigin)
	}
}
