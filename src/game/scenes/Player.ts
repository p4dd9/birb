import type { Game } from './Game'

export class Player extends Phaser.Physics.Arcade.Sprite {
	constructor(scene: Game, x: number, y: number) {
		super(scene, x, y, 'birds', 0)

		this.setScale(4)

		scene.add.existing(this)
		scene.physics.add.existing(this)

		this.setCollideWorldBounds(true)
		;(this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true
		scene.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
			if (body.gameObject === this) {
				scene.gameOver()
			}
		})
	}
}
