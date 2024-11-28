import { ReddiBirdsGame } from './game'
import { gameConfig } from './game.config'

const game = new ReddiBirdsGame(gameConfig)
game.scene.start('Boot', { ...gameConfig })
