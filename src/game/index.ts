import { ReddiBirdsGame } from './game'
import { gameConfig } from './game.config'
import { PostMessageEventManager } from './web/PostMessageEventManager'

PostMessageEventManager.registerEvents()

const game = new ReddiBirdsGame(gameConfig)
game.scene.start('Boot', { ...gameConfig })
