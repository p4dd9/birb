import { ReddiBirdsGame } from './game'
import { gameConfig } from './game.config'
import { WebviewEventManager } from './web/WebviewEventManager'

WebviewEventManager.registerEvents()

const game = new ReddiBirdsGame(gameConfig)
game.scene.start('Boot', { ...gameConfig })
