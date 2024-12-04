import type { Game } from '../scenes/Game'

export class Player extends Phaser.Physics.Arcade.Sprite {
	upRotation: number = -25
	downRotation: number = 25
	velocityThreshold: number = 0

	isAnimating: boolean = false
	currentBirdSprite: number = 0

	constructor(scene: Game, x: number, y: number) {
		super(scene, x, y, 'birds', Number((scene.game.registry.get('playerFrame') ?? 0) * 4))

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
		this.scene.sound.play(`whoosh_swish_small_0${Phaser.Math.Between(1, 3)}`, { volume: 0.4 })
	}

	die() {
		;(this.body as Phaser.Physics.Arcade.Body).enable = false
		this.setTint(0xff0000)
		this.scene.sound.play(`bird_tweety_hurt_0${Phaser.Math.Between(1, 6)}`, { volume: 0.5 })
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
