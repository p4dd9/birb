import type { Types } from 'phaser'
import { Preloader } from './scenes/Preloader'
import { Boot } from './scenes/Boots'
import { Game } from './scenes/Game'
import { GameOver } from './scenes/GameOver'

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	autoFocus: true,
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
	transparent: true,
	scene: [Boot, Preloader, Game, GameOver],
}
