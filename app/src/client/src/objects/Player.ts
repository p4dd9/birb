import { Game } from '../scenes/Game'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { BIRB_DISPLAY_SCALE, birbFlapAnimKey, birbStillFrame } from '../config/birbs.config'
import { PLAYER_FRAME_COUNT } from '@birb/shared/keys'

export class Player extends Phaser.Physics.Arcade.Sprite {
	upRotation: number = -25
	downRotation: number = 25
	velocityThreshold: number = 0

	isAnimating: boolean = false
	currentBirbSprite: number = 0
	scene: Game

	constructor(scene: Game, x: number, y: number) {
		const playerFrame = Number(scene.game.registry.get('playerFrame') ?? 0)
		super(scene, x, y, 'birbs', birbStillFrame(playerFrame))
		this.scene = scene
		this.changePlayerFrame(playerFrame)
		this.setScale(BIRB_DISPLAY_SCALE)

		this.flap = this.flap.bind(this)

		scene.add.existing(this)
		scene.physics.add.existing(this)

		this.setCollideWorldBounds(true)
		// setCircle radius is in source pixels; displayWidth is already scaled.
		;(this.body as Phaser.Physics.Arcade.Body).setCircle(this.width / 2)
		;(this.body as Phaser.Physics.Arcade.Body).onWorldBounds = true
		scene.physics.world.on('worldbounds', (body: Phaser.Physics.Arcade.Body) => {
			if (body.gameObject === this) {
				scene.gameOver()
				this.setCollideWorldBounds(false)
			}
		})
		this.setDepth(40)
	}

	flap() {
		this.setVelocityY(-400)
		this.playFlapAnimation()

		const relativePan = Phaser.Math.Clamp((this.scene.player.x / layoutWidth(this.scene)) * 2 - 1, -0.4, 0.4)
		const randomPitch = Phaser.Math.FloatBetween(0.8, 1.2)
		this.scene.sound.play(`flap${Phaser.Math.Between(1, 3)}`, { pan: relativePan, rate: randomPitch })
	}

	die() {
		;(this.body as Phaser.Physics.Arcade.Body).enable = false
		this.setTint(0xff0000)

		const randomPitch = Phaser.Math.FloatBetween(0.9, 1.1)
		this.scene.sound.play('death1', { volume: 0.2, rate: randomPitch })
		this.scene.sound.play('indiana_punch', { volume: 0.083125 })
		this.scene.tweens.add({
			targets: this,
			y: this.y - 50,
			duration: 300,
			ease: 'Power1',
			onComplete: () => {
				this.scene.tweens.add({
					targets: this,
					y: layoutHeight(this.scene) + 500,
					duration: 1200,
					ease: 'Power1',
					onComplete: () => {
						this.destroy(true)
					},
				})
			},
		})
	}

	updateBirb() {
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
			this.play(birbFlapAnimKey(this.currentBirbSprite), true)
			this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
				this.isAnimating = false
			})
		}
	}

	changePlayerFrame(forcedFrame?: number) {
		if (typeof forcedFrame === 'number') {
			this.currentBirbSprite = forcedFrame
			this.setFrame(birbStillFrame(forcedFrame))
			return
		}
		let newRow
		do {
			newRow = Phaser.Math.Between(0, PLAYER_FRAME_COUNT - 1)
		} while (newRow === this.currentBirbSprite)

		this.currentBirbSprite = newRow
		this.setFrame(birbStillFrame(newRow))
	}
}
