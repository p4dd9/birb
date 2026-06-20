import './phaser-global'
import { applyShellThemeFromPostData, initBirbClient } from './api/birbClient'
import { bootPhaserGame } from './cameraScale'
import { gameConfig } from './game.config'

applyShellThemeFromPostData()
await initBirbClient()
await bootPhaserGame(gameConfig)
