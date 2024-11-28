import type { Game } from './Game'

export class PipePair extends Phaser.GameObjects.Container {
	topPipe: Phaser.GameObjects.NineSlice
	bottomPipe: Phaser.GameObjects.NineSlice

	constructor(scene: Game, x: number, gapY: number) {
		super(scene, x, gapY)

		this.topPipe = scene.add.nineslice(0, -75, 'pipes', 0, 40, 1500, undefined, undefined, 39, 39).setOrigin(0.5, 1)

		this.bottomPipe = scene.add
			.nineslice(0, +75, 'pipes', 0, 40, 1500, undefined, undefined, 39, 39)
			.setOrigin(0.5, 0)

		this.add([this.topPipe, this.bottomPipe])

		scene.add.existing(this)

		scene.pipes.add(this.topPipe)
		scene.pipes.add(this.bottomPipe)

		scene.physics.add.existing(this.topPipe, false)
		scene.physics.add.existing(this.bottomPipe, false)
		;(this.topPipe.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
		;(this.bottomPipe.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)

		scene.tweens.add({
			targets: this,
			x: -50,
			duration: 5000,
			ease: 'Linear',
			onComplete: () => {
				this.destroy()
			},
		})
	}
}
