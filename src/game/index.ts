import { Game } from 'phaser'
import { gameConfig } from './game.config'
import { WebviewEventManager } from './web/WebviewEventManager'

WebviewEventManager.registerEvents()
new Game(gameConfig)
