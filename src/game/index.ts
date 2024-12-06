import { ReddiBirdsGame } from './game'
import { gameConfig } from './game.config'
import { WebviewEventManager } from './web/WebviewEventManager'

document.addEventListener('DOMContentLoaded', () => {
	WebviewEventManager.registerEvents()

	const game = new ReddiBirdsGame(gameConfig)
	game.scene.start('Boot', { ...gameConfig })
})
