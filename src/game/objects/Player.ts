import { Game } from '../scenes/Game'

export class Player extends Phaser.Physics.Arcade.Sprite {
	upRotation: number = -25
	downRotation: number = 25
	velocityThreshold: number = 0

	isAnimating: boolean = false
	currentBirdSprite: number = 0
	scene: Game

	constructor(scene: Game, x: number, y: number) {
		super(scene, x, y, 'birds', Number((scene.game.registry.get('playerFrame') ?? 0) * 4))
		this.scene = scene
		this.changePlayerFrame(Number(scene.game.registry.get('playerFrame') ?? 0))

		this.flap = this.flap.bind(this)

		scene.add.existing(this)
		scene.physics.add.existing(this)

		this.setCollideWorldBounds(true)
		;(this.body as Phaser.Physics.Arcade.Body).setCircle(this.width / 2, 0, 0)
		;(this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true
		scene.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
			if (body.gameObject === this) {
				scene.gameOver()
				this.setCollideWorldBounds(false)
			}
		})
	}

	flap() {
		this.setVelocityY(-300)
		this.playFlapAnimation()

		const relativePan = Phaser.Math.Clamp((this.scene.player.x / this.scene.scale.width) * 2 - 1, -0.4, 0.4)
		const randomPitch = Phaser.Math.FloatBetween(0.8, 1.2)
		this.scene.sound.play(`flap${Phaser.Math.Between(1, 3)}`, { pan: relativePan, rate: randomPitch })
	}

	die() {
		;(this.body as Phaser.Physics.Arcade.Body).enable = false
		this.setTint(0xff0000)

		const randomPitch = Phaser.Math.FloatBetween(0.9, 1.1)
		this.scene.sound.play(`death1`, { volume: 0.1, rate: randomPitch })
		this.scene.tweens.add({
			targets: this,
			y: this.y - 50,
			duration: 300,
			ease: 'Power1',
			onComplete: () => {
				this.scene.tweens.add({
					targets: this,
					y: this.scene.scale.height + 500,
					duration: 1200,
					ease: 'Power1',
					onComplete: () => {
						this.destroy()
					},
				})
			},
		})
	}

	updateBird() {
		if (!this.body) return
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
			this.play(`flap_${this.currentBirdSprite}`, true)
			this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
				this.isAnimating = false
			})
		}
	}

	changePlayerFrame(forcedFrame?: number) {
		if (typeof forcedFrame === 'number') {
			this.currentBirdSprite = forcedFrame
			return
		}
		let newRow
		do {
			newRow = Phaser.Math.Between(0, 6)
		} while (newRow === this.currentBirdSprite)

		this.currentBirdSprite = newRow
	}
}
