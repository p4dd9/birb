import type { RedisPlayer } from '../../shared/messages'
import { MOTIVATIONAL_QUOTES } from '../config/friend.config'
import { PipeGaps } from '../config/pipe.config'
import { MagoText } from '../objects/MagoText'
import { PipePair } from '../objects/PipePair'
import { Player } from '../objects/Player'
import { changeBackgroundStyle } from '../util/dom'
import { Rain } from '../weather/Rain'
import globalEventEmitter from '../web/GlobalEventEmitter'

const speedEarth = 0.26 * 3.5
const speedPipes = 1.3 * 3.5

export class Game extends Phaser.Scene {
	player: Player
	pipes: Phaser.GameObjects.Group
	pipePairs: PipePair[] = []

	score: MagoText
	currentScore: number = 0

	intro: Phaser.GameObjects.Image
	introText: MagoText

	isGameStarted: boolean = false

	spotLight: Phaser.GameObjects.Light

	pipeCount: number
	pipeGap: PipeGaps = PipeGaps.DEFAULT

	isPipeKeyActive: boolean = false
	isLightsOut: boolean = false

	earth: Phaser.GameObjects.TileSprite
	friends: Phaser.GameObjects.Container[] = []

	rain: Rain

	constructor() {
		super('Game')
	}

	create() {
		this.isGameStarted = false
		this.pipeCount = 0

		this.rain = new Rain(this)

		this.sound.stopByKey('Junkala_Select_2')
		this.sound.stopByKey('Junkala_Stake_2')

		this.sound.play('Junkala_Stake_2', { volume: 0.05, loop: true })

		this.spotLight = this.lights.addLight(400, 300, 280).setIntensity(3)
		this.earth = this.add
			.tileSprite(this.scale.width, this.scale.height - 32, this.scale.width, 32, 'earth')
			.setScale(5)
			.setDepth(50)

		this.physics.add.existing(this.earth)
		;(this.earth.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
		;(this.earth.body as Phaser.Physics.Arcade.Body).setImmovable(true)

		this.start = this.start.bind(this)
		this.hitPipe = this.hitPipe.bind(this)
		this.addPipeRow = this.addPipeRow.bind(this)

		this.player = new Player(this, 200, this.scale.height / 2 - 100)
		this.pipes = this.physics.add.group()

		this.physics.add.overlap(this.player, this.pipes, this.hitPipe, undefined, this)
		this.physics.add.overlap(this.player, this.earth, this.hitPipe, undefined, this)
		;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)

		this.intro = this.add.image(this.player.x + 100, this.player.y + 100, 'Icon_Cursor_02a').setScale(3)

		this.introText = new MagoText(this, this.player.x, this.player.y + 75, 'Tap', 72)
		this.score = new MagoText(this, this.scale.width / 2, 12, '0', 121).setDepth(100).setOrigin(0.5, 0)

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
		this.cheeringBirbs()
	}

	byeFriends() {
		this.tweens.add({
			targets: this.friends,
			x: -400,
			y: -400,
			duration: 5000,
			angle: 25,
			onComplete: () => {
				for (let friend of this.friends) {
					friend.destroy(true)
				}
			},
		})
	}

	cheeringBirbs() {
		const friends = (this.registry.get('community:leaderboard') as RedisPlayer[]) ?? [
			{ userId: 0, userName: 'Stranger', score: 0, attempts: 0 },
		]
		if (!friends || friends.length < 0) return

		const randomFriends = this.shuffleArray(friends)
		for (let f = 0; f < 3; f++) {
			const friend = randomFriends[f]
			if (!friend) return
			const birbFrameIndex = Phaser.Math.Between(0, 6)
			const rngSlot = [
				[this.scale.width / 2, this.scale.height / 2],
				[this.scale.width / 2 + 200, this.scale.height / 2 - 200],
				[this.scale.width / 2 + 100, this.scale.height / 2 + 200],
			]
			const friendContainer = this.add.container(rngSlot[f]![0], rngSlot[f]![1])
			const friendSprite = this.add.sprite(0, 0, 'birbs', birbFrameIndex).setFlipX(true)
			const friendName = new MagoText(this, 0, 60, friend.userName, 48)
			const friendMessage = new MagoText(this, 0, -60, this.getRandomMotivationQuote(), 48)

			friendSprite.play(`flap_${birbFrameIndex}_repeat`, true)
			friendContainer.add([friendSprite, friendName, friendMessage])
			this.friends.push(friendContainer)
		}
	}

	shuffleArray(array: RedisPlayer[]) {
		const arrayCopy = [...array]
		for (var i = arrayCopy.length - 1; i >= 0; i--) {
			var j = Math.floor(Math.random() * (i + 1))
			var temp = arrayCopy[i]
			arrayCopy[i] = arrayCopy[j]!
			arrayCopy[j] = temp!
		}
		return arrayCopy
	}

	getRandomMotivationQuote() {
		return MOTIVATIONAL_QUOTES[Phaser.Math.Between(0, MOTIVATIONAL_QUOTES.length - 1)] ?? ''
	}

	update() {
		if (this.isGameStarted) {
			this.player.updateBirb()
		}

		this.earth.setTilePosition(this.earth.tilePositionX + speedEarth)
		for (let pipePair of this.pipePairs) {
			pipePair.setX(pipePair.x - speedPipes)

			if (pipePair.x < -50) {
				pipePair.topPipe.destroy(true)
				pipePair.bottomPipe.destroy(true)
				pipePair.destroy(true)
			}
		}
	}

	start() {
		if (this.isGameStarted) return
		this.isGameStarted = true
		;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true)
		this.startPipeTimer()
		this.byeFriends()
		this.intro.destroy(true)
		this.introText.destroy(true)
	}

	resize() {
		this.score.setPosition(this.scale.width / 2, 12)
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
			this.pipePairs.push(new PipePair(this, this.cameras.main.width + 50))
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
		this.pipeCount = 0
		this.physics.pause()
		this.rain.stop()
		this.cleanUpLightsOutEffects()
		this.isPipeKeyActive = false

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

		this.isLightsOut = true

		this.pipes.getChildren().map((pipe) => {
			;(pipe as Phaser.GameObjects.NineSlice).setPipeline('Light2D')
		})

		this.earth.setPipeline('Light2D')
		this.sound.play('lightsout', { volume: 0.3 })

		const canvasParent = document.querySelector('#game-container > canvas')
		let currentBackground = null

		if (canvasParent && canvasParent instanceof HTMLCanvasElement) {
			currentBackground = window.getComputedStyle(canvasParent).background.toString()
			const darkenBackground = 'linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)),' + currentBackground
			canvasParent.style.background = darkenBackground
		}

		this.events.on('update', this.onPointerMoveLightsOuts, this)
		this.time.delayedCall(6000, this.cleanUpLightsOutEffects, undefined, this)
	}

	cleanUpLightsOutEffects() {
		this.lights.disable()
		this.isLightsOut = false

		this.pipes.getChildren().map((pipe) => {
			;(pipe as Phaser.GameObjects.NineSlice).resetPipeline()
		})

		this.earth.setPipeline('Light2D').resetPipeline()
		changeBackgroundStyle(this.registry.get('background'))

		this.events.off('update', this.onPointerMoveLightsOuts, this)
	}

	onPointerMoveLightsOuts() {
		this.spotLight.setPosition(this.player.x, this.player.y)
	}

	pixelate() {
		const pixelation = this.cameras.main.postFX.addPixelate(0)
		this.sound.play('pixelate', { volume: 0.3 })
		this.tweens.add({
			targets: pixelation,
			amount: 7,
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

	shrinkPlayer() {
		const randomPitch = Phaser.Math.FloatBetween(0.9, 1.1)
		this.sound.play(`shrink`, {
			rate: randomPitch,
			volume: 0.2,
		})

		this.tweens.add({
			targets: this.player,
			scale: 0.6,
			duration: 400,
		})

		this.time.delayedCall(10000, () => {
			const randomPitch = Phaser.Math.FloatBetween(0.9, 1.1)
			this.sound.play(`grow`, {
				rate: randomPitch,
				volume: 0.2,
			})
			this.tweens.add({
				targets: this.player,
				scale: 1,
				duration: 400,
			})
		})
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

	pickUpKey(key: 'bronze' | 'silver' | 'gold') {
		this.changePipeGap(key)
	}

	changePipeGap(key: 'bronze' | 'silver' | 'gold') {
		switch (key) {
			case 'bronze': {
				this.pipeGap = PipeGaps.BRONZE
				break
			}
			case 'silver': {
				this.pipeGap = PipeGaps.BRONZE
				break
			}
			case 'gold': {
				this.pipeGap = PipeGaps.GOLD
				break
			}
			default: {
				this.pipeGap = PipeGaps.DEFAULT
				break
			}
		}
		this.isPipeKeyActive = true

		for (let pipePair of this.pipePairs) {
			pipePair.gapTween()
		}

		this.time.delayedCall(5000, () => {
			this.isPipeKeyActive = false
			this.pipeGap = PipeGaps.DEFAULT
		})
	}
}
