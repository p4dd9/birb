import type { Game } from './Game'

export class PipePair extends Phaser.GameObjects.Container {
	topPipe: Phaser.GameObjects.NineSlice
	bottomPipe: Phaser.GameObjects.NineSlice

	constructor(scene: Game, x: number, y: number) {
		super(scene, x, y)

		this.topPipe = scene.add.nineslice(0, -100, 'pipes', 0, 64, 500, 0, 0, 12, 12).setOrigin(0.5, 1)
		this.bottomPipe = scene.add.nineslice(0, 100, 'pipes', 0, 64, 500, 0, 0, 12, 12).setOrigin(0.5, 0)

		this.add([this.topPipe, this.bottomPipe])
		scene.add.existing(this)

		scene.pipes.add(this.topPipe)
		scene.pipes.add(this.bottomPipe)
	}
}
