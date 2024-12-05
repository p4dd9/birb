import type { Game } from '../scenes/Game'

const PIPE_WIDTH = 90

export class PipePair extends Phaser.GameObjects.Container {
	topPipe: Phaser.GameObjects.NineSlice
	bottomPipe: Phaser.GameObjects.NineSlice
	scoreZone: Phaser.GameObjects.Zone

	scene: Game

	constructor(scene: Game, x: number, gapY: number) {
		super(scene, x, gapY)
		this.scene = scene

		this.invokeCoin = this.invokeCoin.bind(this)
		this.invokeMysteryBox = this.invokeMysteryBox.bind(this)

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

	createPowerUp(item?: 'coin') {
		const random = Phaser.Math.FloatBetween(0, 1)

		if (random >= 0.3 || item === 'coin') {
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
		if (Phaser.Math.Between(0, 1) > 0) {
			const randomPitch = Phaser.Math.FloatBetween(0.99, 1.01)
			this.scene.sound.play(`shrink`, {
				rate: randomPitch,
				volume: 0.2,
			})
			this.scene.player.setScale(0.5)
		} else {
			const randomPitch = Phaser.Math.FloatBetween(0.99, 1.01)
			this.scene.sound.play(`grow`, {
				rate: randomPitch,
				volume: 0.2,
			})
			this.scene.player.setScale(1.5)
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
