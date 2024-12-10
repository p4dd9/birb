import type { Types } from 'phaser'
import { Boot } from './scenes/Boot'
import { Game } from './scenes/Game'
import { GameOver } from './scenes/GameOver'
import { Menu } from './scenes/Menu'
import { Preloader } from './scenes/Preloader'

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	autoFocus: true,
	parent: 'game-container',
	scale: {
		mode: Phaser.Scale.EXPAND,
	},
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 790, x: 0 },
			debug: false,
		},
	},
	fps: {
		target: 100,
		limit: 120,
		min: 30,
	},
	transparent: true,
	scene: [Boot, Preloader, Menu, Game, GameOver],
}
