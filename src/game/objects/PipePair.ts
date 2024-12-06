import type { Game } from '../scenes/Game'

const PIPE_WIDTH = 90
const GAP_HEIGHT = 150

const MIN_Y_CENTER = 100
const MAX_Y_CENTER = 400

export class PipePair extends Phaser.GameObjects.Container {
	topPipe: Phaser.GameObjects.NineSlice
	bottomPipe: Phaser.GameObjects.NineSlice
	scoreZone: Phaser.GameObjects.Zone
	scene: Game

	constructor(scene: Game, x: number) {
		super(scene, x, Phaser.Math.Between(MIN_Y_CENTER, MAX_Y_CENTER))
		this.scene = scene

		this.invokeCoin = this.invokeCoin.bind(this)
		this.invokeMysteryBox = this.invokeMysteryBox.bind(this)

		const pipeFrame = scene.game.registry.get('pipeFrame')
		this.topPipe = scene.add
			.nineslice(
				0,
				-GAP_HEIGHT / 2,
				'pipes',
				pipeFrame ?? 0,
				PIPE_WIDTH,
				scene.scale.height,
				undefined,
				undefined,
				39,
				39
			)
			.setOrigin(0.5, 1)
			.setName('pipe')

		this.bottomPipe = scene.add
			.nineslice(
				0,
				GAP_HEIGHT / 2,
				'pipes',
				pipeFrame ?? 0,
				PIPE_WIDTH,
				scene.scale.height,
				undefined,
				undefined,
				39,
				39
			)
			.setOrigin(0.5, 0)
			.setName('pipe')

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

		if (this.scene.currentScore > 0 && this.scene.currentScore % 2 === 0 && Phaser.Math.Between(0, 1) > 0) {
			this.createPowerUp()
		}

		if (this.scene.currentScore === 1) {
			this.createPowerUp('coin')
		}

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

	createPowerUp(item?: 'coin' | 'mystery_box') {
		const random = Phaser.Math.FloatBetween(0, 1)

		if (item) {
			if (item === 'mystery_box') {
				this.createPowerUpItem('mystery_box', this.invokeMysteryBox)
			} else if (item === 'coin') {
				this.createPowerUpItem('coin', this.invokeCoin)
			}
			return
		}

		if (random >= 0.5) {
			this.createPowerUpItem('coin', this.invokeCoin)
		} else {
			this.createPowerUpItem('mystery_box', this.invokeMysteryBox)
		}
	}

	createPowerUpItem(spriteAnim: string, cb: () => void) {
		const powerup = this.scene.add.sprite(0, 0, 'animated_items').setScale(3).play(spriteAnim)
		this.scene.physics.add.existing(powerup, false)
		;(powerup.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
		;(powerup.body as Phaser.Physics.Arcade.Body).setImmovable(true)

		this.scene.physics.add.overlap(this.scene.player, powerup, () => {
			powerup.destroy()
			cb()
		})
		this.add(powerup)
	}

	invokeMysteryBox() {
		const effectIndex = Phaser.Math.Between(1, 4)
		switch (effectIndex) {
			case 1:
				this.scene.shrinkPlayer()
				break
			case 2:
				this.scene.growPlayer()
				break
			case 3:
				this.scene.pixelate()
				break
			case 4:
				this.scene.lightsOut()
				break
			default:
				console.warn('Unhandled mystery box effect!')
				break
		}
	}

	invokeCoin() {
		const relativePan = Phaser.Math.Clamp((this.scene.player.x / this.scene.scale.width) * 2 - 1, -0.4, 0.4)
		const randomPitch = Phaser.Math.FloatBetween(0.99, 1.01)
		this.scene.sound.play(`Pickup_Coin_${Phaser.Math.Between(0, 3)}`, {
			pan: relativePan,
			rate: randomPitch,
			volume: 0.2,
		})
		this.scene.incrementScore()
	}
}
