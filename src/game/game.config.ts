import type { Types } from 'phaser'
import { Preloader } from './scenes/Preloader'
import { Boot } from './scenes/Boots'
import { Game } from './scenes/Game'

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	autoFocus: true,
	scale: {
		mode: Phaser.Scale.EXPAND,
	},
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 300, x: 0 },
			debug: true,
		},
	},
	transparent: true,
	scene: [Boot, Preloader, Game],
}
