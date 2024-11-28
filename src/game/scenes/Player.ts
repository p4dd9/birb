export class Player extends Phaser.Physics.Arcade.Sprite {
	constructor(scene: Phaser.Scene, x: number, y: number) {
		super(scene, x, y, 'birds', 0)
		this.setScale(7)

		scene.add.existing(this)

		scene.physics.add.existing(this)
		this.setCollideWorldBounds(true)
		this.setGravityY(300)
	}
}
