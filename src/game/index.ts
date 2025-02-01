import { Game } from 'phaser'
import { gameConfig } from './game.config'
import { WebviewEventManager } from './web/WebviewEventManager'

console.log('?')

WebviewEventManager.registerEvents()
new Game(gameConfig)
