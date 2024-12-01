import type { Game } from '../scenes/Game'

export class Player extends Phaser.Physics.Arcade.Sprite {
	upRotation: number = -25
	downRotation: number = 25
	velocityThreshold: number = 0

	isAnimating: boolean = false

	constructor(scene: Game, x: number, y: number) {
		super(scene, x, y, 'birds', 0)

		this.setScale(4)

		scene.add.existing(this)
		scene.physics.add.existing(this)

		this.setCollideWorldBounds(true)
		;(this.body as Phaser.Physics.Arcade.Body).setCircle(this.width / 2, 0, 0)
		;(this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true
		scene.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
			if (body.gameObject === this) {
				scene.gameOver()
			}
		})
	}

	updateBird() {
		const velocityY = (this.body as Phaser.Physics.Arcade.Body).velocity.y

		if (velocityY < this.velocityThreshold) {
			this.setAngle(this.upRotation)
		} else {
			this.setAngle(this.downRotation)
		}
	}

	playFlapAnimation() {
		if (!this.isAnimating) {
			this.isAnimating = true
			this.play('flap', true)
			this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
				this.isAnimating = false
			})
		}
	}
}
