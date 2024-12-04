import type { Game } from '../scenes/Game'

const PIPE_WIDTH = 90

export class PipePair extends Phaser.GameObjects.Container {
	topPipe: Phaser.GameObjects.NineSlice
	bottomPipe: Phaser.GameObjects.NineSlice
	scoreZone: Phaser.GameObjects.Zone

	constructor(scene: Game, x: number, gapY: number) {
		super(scene, x, gapY)

		const pipeFrame = scene.game.registry.get('pipeFrame')
		this.topPipe = scene.add
			.nineslice(0, -75, 'pipes', pipeFrame ?? 0, PIPE_WIDTH, 1500, undefined, undefined, 39, 39)
			.setOrigin(0.5, 1)

		this.bottomPipe = scene.add
			.nineslice(0, +75, 'pipes', pipeFrame ?? 0, PIPE_WIDTH, 1500, undefined, undefined, 39, 39)
			.setOrigin(0.5, 0)

		this.scoreZone = scene.add.zone(0, 0, PIPE_WIDTH, 150).setOrigin(0.5)
		scene.physics.add.existing(this.scoreZone, false)
		;(this.scoreZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
		;(this.scoreZone.body as Phaser.Physics.Arcade.Body).setImmovable(true)

		this.add([this.topPipe, this.bottomPipe, this.scoreZone])
		scene.add.existing(this)

		scene.pipes.add(this.topPipe)
		scene.pipes.add(this.bottomPipe)

		scene.physics.add.overlap(scene.player, this.scoreZone, () => {
			scene.incrementScore()
			this.scoreZone.destroy()
		})

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
