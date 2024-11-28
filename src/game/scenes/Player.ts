export class Player extends Phaser.Physics.Arcade.Sprite {
	constructor(scene: Phaser.Scene, x: number, y: number) {
		super(scene, x, y, 'birds', 0)

		this.setScale(4)

		scene.add.existing(this)
		scene.physics.add.existing(this)

		this.setCollideWorldBounds(true)
		;(this.body as Phaser.Physics.Arcade.Body).onWorldBounds = () => {
			console.log('hi')
		}
	}
}
