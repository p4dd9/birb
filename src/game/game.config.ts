import type { Types } from 'phaser'
import { Boot } from './scenes/Boots'
import { Game } from './scenes/Game'
import { GameOver } from './scenes/GameOver'
import { Menu } from './scenes/Menu'
import { Preloader } from './scenes/Preloader'

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
	pixelArt: true,
	transparent: true,
	scene: [Boot, Preloader, Menu, Game, GameOver],
}
