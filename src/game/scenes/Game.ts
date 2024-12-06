import { PipePair } from '../objects/PipePair'
import { Player } from '../objects/Player'
import { PrimaryText } from '../objects/PrimaryText'
import globalEventEmitter from '../web/GlobalEventEmitter'

export class Game extends Phaser.Scene {
	player: Player
	pipes: Phaser.GameObjects.Group
	score: PrimaryText
	currentScore: number = 0

	intro: Phaser.GameObjects.Image
	introText: PrimaryText

	isGameStarted: boolean = false

	spotLight: Phaser.GameObjects.Light

	pipeCount: number = 0

	constructor() {
		super('Game')
	}

	create() {
		this.isGameStarted = false

		this.sound.stopByKey('Junkala_Select_2')
		this.sound.stopByKey('Junkala_Stake_2')

		this.sound.play('Junkala_Stake_2', { volume: 0.05, loop: true })

		this.spotLight = this.lights.addLight(400, 300, 280).setIntensity(3)

		this.start = this.start.bind(this)
		this.hitPipe = this.hitPipe.bind(this)
		this.addPipeRow = this.addPipeRow.bind(this)

		this.player = new Player(this, 200, this.scale.height / 2 - 100)
		this.pipes = this.physics.add.group()

		this.physics.add.overlap(this.player, this.pipes, this.hitPipe, undefined, this)
		;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)

		this.intro = this.add.image(this.player.x + 100, this.player.y + 100, 'Icon_Cursor_02a').setScale(3)
		this.introText = new PrimaryText(this, this.player.x, this.player.y + 75, 'Tap', { fontSize: 72 }).setOrigin(
			0.5,
			0.5
		)

		this.score = new PrimaryText(this, this.scale.width / 2, -20, '0', {
			fontSize: 121,
		})
			.setDepth(100)
			.setOrigin(0.5, 0)

		this.input.once('pointerdown', this.start)
		this.input.on('pointerdown', this.player.flap)

		this.scale.on('resize', this.resize, this)

		this.input.keyboard?.createCombo('phaser', {
			resetOnWrongKey: true,
			resetOnMatch: true,
			deleteOnMatch: false,
		})
		this.input.keyboard?.on('keycombomatch', () => {
			this.player.changePlayerFrame(7)
		})

		this.resetScore()
	}

	override update(_time: number, _delta: number) {
		if (this.isGameStarted) {
			this.player.updateBird()
		}
	}

	start() {
		console.log('start')
		if (this.isGameStarted) return
		this.isGameStarted = true
		;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true)
		this.startPipeTimer()

		this.intro.destroy()
		this.introText.destroy()
	}

	resize() {
		this.score.setX(this.scale.width / 2)
		if (!this.isGameStarted) {
			this.player.setPosition(200, this.scale.height / 2 - 100)
			this.intro.setPosition(this.player.x + 100, this.player.y + 100)
			this.introText.setPosition(this.player.x, this.player.y + 75)
		}
	}

	startPipeTimer() {
		this.time.addEvent({
			startAt: 1450,
			delay: 1500,
			callback: this.addPipeRow,
			callbackScope: this,
			loop: true,
		})
	}

	addPipeRow() {
		if (this.isGameStarted) {
			new PipePair(this, this.cameras.main.width + 50)
			this.pipeCount++
		}
	}

	hitPipe() {
		this.gameOver()
	}

	incrementScore(score: number = 1) {
		this.currentScore += score
		this.score.setText(this.currentScore.toString())
	}

	resetScore() {
		this.currentScore = 0
		this.score.setText(this.currentScore.toString())
	}

	gameOver() {
		this.input.off('pointerdown', this.player.flap)
		this.player.die()

		this.physics.pause()
		console.log('digga')
		globalEventEmitter.emit('saveStats', this.currentScore)
		globalEventEmitter.once(
			'gameOver',
			(data: { isNewHighscore: boolean; newScore: number; highscore: number; attempts: number }) => {
				this.scale.off('resize', this.resize, this)
				this.scene.run('GameOver', data)
			}
		)
	}

	lightsOut() {
		this.lights.enable()
		this.lights.setAmbientColor(0x222222)

		this.pipes.getChildren().map((pipe) => {
			;(pipe as Phaser.GameObjects.NineSlice).setPipeline('Light2D').setAlpha(0.4)
		})
		this.sound.play('lightsout', { volume: 0.3 })
		this.events.on('update', this.onPointerMoveLightsOuts, this)
		this.time.delayedCall(6000, () => {
			this.lights.disable()
			this.pipes.getChildren().map((pipe) => {
				;(pipe as Phaser.GameObjects.NineSlice).setAlpha(1)
				;(pipe as Phaser.GameObjects.NineSlice).resetPipeline()
			})
			this.events.off('update', this.onPointerMoveLightsOuts, this)
		})
	}

	onPointerMoveLightsOuts() {
		this.spotLight.setPosition(this.player.x, this.player.y)
	}

	pixelate() {
		const pixelation = this.cameras.main.postFX.addPixelate(0)
		this.sound.play('pixelate', { volume: 0.3 })
		this.tweens.add({
			targets: pixelation,
			amount: 8,
			duration: 1000,
			callbackScope: this,
			onComplete: () => {
				this.time.delayedCall(4000, () => {
					this.tweens.add({
						targets: pixelation,
						amount: 1,
						duration: 1000,
						onComplete: () => {
							this.cameras.main.postFX.clear()
						},
					})
				})
			},
		})
	}

	growPlayer() {
		const randomPitch = Phaser.Math.FloatBetween(0.9, 1.1)
		this.sound.play(`grow`, {
			rate: randomPitch,
			volume: 0.2,
		})
		this.player.setScale(1.5)
	}

	shrinkPlayer() {
		const randomPitch = Phaser.Math.FloatBetween(0.9, 1.1)
		this.sound.play(`shrink`, {
			rate: randomPitch,
			volume: 0.2,
		})
		this.player.setScale(0.5)
	}

	pickupEmerald() {
		const relativePan = Phaser.Math.Clamp((this.player.x / this.scale.width) * 2 - 1, -0.4, 0.4)
		const randomPitch = Phaser.Math.FloatBetween(0.99, 1.01)
		this.sound.play(`Pickup_Coin_${Phaser.Math.Between(0, 3)}`, {
			pan: relativePan,
			rate: randomPitch,
			volume: 0.2,
		})
		this.incrementScore(5)
	}

	pickUpSapphire() {
		const relativePan = Phaser.Math.Clamp((this.player.x / this.scale.width) * 2 - 1, -0.4, 0.4)
		const randomPitch = Phaser.Math.FloatBetween(0.99, 1.01)
		this.sound.play(`Pickup_Coin_${Phaser.Math.Between(0, 3)}`, {
			pan: relativePan,
			rate: randomPitch,
			volume: 0.2,
		})
		this.incrementScore(10)
	}
}
