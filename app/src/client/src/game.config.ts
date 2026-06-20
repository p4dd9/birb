import type { Types } from 'phaser'
import Phaser from 'phaser'
import { REF_HEIGHT, REF_WIDTH } from './config/gameplayLayout'
import './phaser-global'
import { Boot } from './scenes/Boot'
import { Game } from './scenes/Game'
import { GameOver } from './scenes/GameOver'
import { Menu } from './scenes/Menu'
import { Preloader } from './scenes/Preloader'

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	autoFocus: true,
	parent: 'game-container',
	width: REF_WIDTH,
	height: REF_HEIGHT,
	scale: {
		// Fixed 480×720 world; Phaser letterboxes/scales the canvas to the embed on every device.
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
	roundPixels: true,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 990, x: 0 },
			debug: false,
			debugShowBody: true,
			debugShowStaticBody: true,
			debugShowVelocity: true,
			debugBodyColor: 0x32a852,
			debugStaticBodyColor: 0x32a852,
			debugVelocityColor: 0x32a852,
		},
	},
	fps: {
		target: 100,
		limit: 100,
		min: 40,
	},
	transparent: true,
	scene: [Boot, Preloader, Menu, Game, GameOver],
}
