import type { Game } from '../scenes/Game'
import type { SeededRng } from '@birb/shared'
import { getGameplayLayout, scalePipeGap } from '../config/gameplayLayout'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { pipeRng } from '../util/gameRng'

/** Pipe sprite is 32×80; slice insets match in-game/DOM frame (6px sides, 39px caps). */
const PIPE_SLICE_SIDE = 6
const PIPE_SLICE_CAP = 39

export class PipePair extends Phaser.GameObjects.Container {
	topPipe: Phaser.GameObjects.NineSlice
	bottomPipe: Phaser.GameObjects.NineSlice
	scoreZone: Phaser.GameObjects.Zone
	scene: Game
	pipeNumber: number
	gapHeightMultiplier: number
	private rng: SeededRng

	constructor(scene: Game, x: number) {
		const layout = getGameplayLayout(scene)
		const scaledGap = scalePipeGap(scene, scene.pipeGap)
		const pipeNumber = scene.pipeCount
		const seed = (scene.game.registry.get('daily:seed') as number) ?? 0
		const rng = pipeRng(seed, pipeNumber)
		const gapHalf = (scaledGap / 2) * (pipeNumber < 15 ? 1.5 : 1)
		const pipeSideSlice = (layout.pipeWidth / 32) * PIPE_SLICE_SIDE
		const pipeCenterY =
			pipeNumber === 0
				? Phaser.Math.Clamp(
						scene.player.y + 60,
						layout.pipeCenterMinY + gapHalf,
						layout.pipeCenterMaxY - gapHalf
					)
				: rng.between(layout.pipeCenterMinY, layout.pipeCenterMaxY)

		super(scene, x, pipeCenterY)
		this.scene = scene
		this.pipeNumber = pipeNumber
		this.rng = rng

		this.invokeCoin = this.invokeCoin.bind(this)
		this.invokeEmerald = this.invokeEmerald.bind(this)
		this.invokeSapphire = this.invokeSapphire.bind(this)
		this.invokeMysteryBox = this.invokeMysteryBox.bind(this)
		this.invokeBronzeKey = this.invokeBronzeKey.bind(this)
		this.invokeSilverKey = this.invokeSilverKey.bind(this)
		this.invokeGoldKey = this.invokeGoldKey.bind(this)

		this.gapHeightMultiplier = scene.pipeCount < 15 ? 1.5 : 1

		const pipeFrame = scene.game.registry.get('pipeFrame')
		this.topPipe = scene.add
			.nineslice(
				0,
				(-scaledGap / 2) * this.gapHeightMultiplier,
				'pipes',
				pipeFrame ?? 0,
				layout.pipeWidth,
				layoutHeight(scene),
				pipeSideSlice,
				pipeSideSlice,
				PIPE_SLICE_CAP,
				PIPE_SLICE_CAP
			)
			.setOrigin(0.5, 1)
			.setName('pipe')

		this.bottomPipe = scene.add
			.nineslice(
				0,
				(scaledGap / 2) * this.gapHeightMultiplier,
				'pipes',
				pipeFrame ?? 0,
				layout.pipeWidth,
				layoutHeight(scene),
				pipeSideSlice,
				pipeSideSlice,
				PIPE_SLICE_CAP,
				PIPE_SLICE_CAP
			)
			.setOrigin(0.5, 0)
			.setName('pipe')

		this.scoreZone = scene.add.zone(0, 0, layout.pipeWidth, layout.scoreZoneHeight).setOrigin(0.5)
		scene.physics.add.existing(this.scoreZone, false)
		;(this.scoreZone.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
		;(this.scoreZone.body as Phaser.Physics.Arcade.Body).setImmovable(true)

		this.add([this.topPipe, this.bottomPipe, this.scoreZone])
		scene.add.existing(this)

		scene.pipes.add(this.topPipe)
		scene.pipes.add(this.bottomPipe)

		scene.physics.add.overlap(scene.player, this.scoreZone, () => {
			scene.incrementScore()
			this.scoreZone.destroy(true)
		})

		scene.physics.add.existing(this.topPipe, false)
		scene.physics.add.existing(this.bottomPipe, false)
		;(this.topPipe.body as Phaser.Physics.Arcade.Body)
			.setAllowGravity(false)
			.setSize(this.topPipe.displayWidth * 0.9, this.topPipe.displayHeight * 0.99)
		;(this.bottomPipe.body as Phaser.Physics.Arcade.Body)
			.setAllowGravity(false)
			.setSize(this.topPipe.displayWidth * 0.9, this.topPipe.displayHeight * 0.99)

		if (this.pipeNumber === 0) {
			this.createPowerUp('coin')
		}

		if (this.pipeNumber > 0 && this.rng.between(0, 1) > 0) {
			this.createPowerUp()
		}

		if (this.pipeNumber >= 100 && this.pipeNumber < 500) {
			scene.tweens.add({
				targets: [this.topPipe, this.bottomPipe],
				alpha: 0,
				duration: 1000,
				yoyo: true,
				repeat: -1,
				ease: 'Linear',
			})
		}

		if (this.pipeNumber >= 50) {
			scene.tweens.add({
				targets: this,
				y: this.y + layout.pipeWobbleY * (this.rng.between(0, 1) > 0 ? -1 : 1),
				duration: 2000,
				yoyo: true,
				ease: 'Linear',
			})
		}

		if (this.pipeNumber >= 500) {
			scene.tweens.add({
				targets: [this.topPipe, this.bottomPipe],
				alpha: 0,
				duration: 750,
				ease: 'Linear',
			})
		}

		if (this.pipeNumber > 0 && this.pipeNumber % 420 === 0) {
			scene.cameras.main.shake(10000, 0.01)
			scene.time.delayedCall(3000, () => {
				scene.cameras.main.shake(0)
			})
		}

		if (this.pipeNumber === 0) {
			scene.isPipeKeyActive = false
		}

		if (this.pipeNumber > 0 && this.pipeNumber % 75 === 0) {
			this.scene.rain.toggle()
		}

		if (scene.isPipeKeyActive) {
			scene.time.delayedCall(500, () => {
				this.gapTween()
			})
		}

		if (scene.isLightsOut) {
			this.topPipe.setAlpha(0.15)
			this.bottomPipe.setAlpha(0.15)
		}
		this.setDepth(30)
		this.topPipe.setDepth(30)
		this.bottomPipe.setDepth(30)
	}

	gapTween() {
		if (!this.scene) return
		const scaledGap = scalePipeGap(this.scene, this.scene.pipeGap)
		this.scene.tweens.add({
			targets: this.topPipe,
			y: this.topPipe.y + -scaledGap / 2,
			duration: 1000,
		})

		this.scene.tweens.add({
			targets: this.bottomPipe,
			y: this.bottomPipe.y + scaledGap / 2,
			duration: 1000,
		})
		this.scene.sound.play('Pipes_Down1', { volume: 0.4 })
		this.scoreZone.setScale(1, 4)
	}

	createPowerUp(item?: 'coin' | 'mystery_box' | 'emerald' | 'sapphire' | 'key') {
		const random = this.rng.next()
		if (item) {
			if (item === 'mystery_box') {
				this.createPowerUpItem('mystery_box', this.invokeMysteryBox)
			} else if (item === 'coin') {
				this.createPowerUpItem('coin', this.invokeCoin)
			} else if (item === 'emerald') {
				this.createPowerUpItem('emerald', this.invokeEmerald)
			} else if (item === 'sapphire') {
				this.createPowerUpItem('sapphire', this.invokeSapphire)
			} else if (item === 'key') {
				const key = this.getRandomKey()
				if (key === 'bronze_key') {
					this.createPowerUpItem(key, this.invokeBronzeKey)
				} else if (key === 'silver_key') {
					this.createPowerUpItem(key, this.invokeSilverKey)
				} else if (key === 'gold_key') {
					this.createPowerUpItem(key, this.invokeGoldKey)
				}
			}

			return
		}

		if (random >= 0.25) {
			this.createPowerUpItem('coin', this.invokeCoin)
		} else if (random >= 0.1) {
			if (this.rng.between(0, 1) > 0) {
				this.createPowerUpItem('mystery_box', this.invokeMysteryBox)
			} else {
				const key = this.getRandomKey()
				if (key === 'bronze_key') {
					this.createPowerUpItem(key, this.invokeBronzeKey)
				} else if (key === 'silver_key') {
					this.createPowerUpItem(key, this.invokeSilverKey)
				} else if (key === 'gold_key') {
					this.createPowerUpItem(key, this.invokeGoldKey)
				}
			}
		} else if (random >= 0.05) {
			this.createPowerUpItem('emerald', this.invokeEmerald)
		} else {
			this.createPowerUpItem('sapphire', this.invokeSapphire)
		}
	}

	createPowerUpItem(spriteAnim: string, cb: () => void) {
		const powerup = this.scene.add.sprite(0, 0, 'animated_items').setScale(3).play(spriteAnim)
		this.scene.physics.add.existing(powerup, false)
		;(powerup.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
		;(powerup.body as Phaser.Physics.Arcade.Body).setImmovable(true)

		this.scene.physics.add.overlap(this.scene.player, powerup, () => {
			powerup.destroy(true)
			cb()
		})
		this.add(powerup)
	}

	invokeEmerald() {
		this.scene.pickupEmerald()
	}

	invokeSapphire() {
		this.scene.pickUpSapphire()
	}

	invokeBronzeKey() {
		this.scene.sound.play('PickupKey_1', { volume: 0.5 })
		this.scene.pickUpKey('bronze')
	}
	invokeSilverKey() {
		this.scene.sound.play('PickupKey_2', { volume: 0.5 })
		this.scene.pickUpKey('silver')
	}
	invokeGoldKey() {
		this.scene.sound.play('PickupKey_3', { volume: 0.5 })
		this.scene.pickUpKey('gold')
	}

	getRandomKey() {
		const effectIndex = this.rng.between(1, 3)
		switch (effectIndex) {
			case 1:
				return 'bronze_key'
			case 2:
				return 'silver_key'
			case 3:
				return 'gold_key'
			default:
				console.warn('Where did that key come from?')
				return ''
		}
	}

	invokeMysteryBox() {
		const effectIndex = this.rng.between(1, 3)
		switch (effectIndex) {
			case 1:
				this.scene.shrinkPlayer()
				break
			case 2:
				this.scene.pixelate()
				break
			case 3:
				this.scene.lightsOut()
				break
			default:
				console.warn('Unhandled mystery box effect!')
				break
		}
	}

	invokeCoin() {
		const relativePan = Phaser.Math.Clamp((this.scene.player.x / layoutWidth(this.scene)) * 2 - 1, -0.4, 0.4)
		const randomPitch = Phaser.Math.FloatBetween(0.99, 1.01)
		this.scene.sound.play(`Pickup_Coin_${Phaser.Math.Between(0, 3)}`, {
			pan: relativePan,
			rate: randomPitch,
			volume: 0.2,
		})
		this.scene.incrementScore()
	}
}
