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
	scene: [Boot, Preloader, Game],
}
