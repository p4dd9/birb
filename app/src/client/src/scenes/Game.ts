import { clientLogger } from '@birb/shared'
import { birbBridge } from '../api/birbBridge'
import { getDailyNumber, saveScore, shouldAutoplayMusic } from '../api/birbClient'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { BIRB_DISPLAY_SCALE } from '../config/birbs.config'
import { FIREWORK_BURST_COUNT } from '../config/fireworks.config'
import { getGameplayLayout, type GameplayLayout } from '../config/gameplayLayout'
import { PipeGaps } from '../config/pipe.config'
import { FireworksManager } from '../effects/FireworksManager'
import { LivesHud, readLivesFromRegistry } from '../objects/LivesHud'
import { MagoText } from '../objects/MagoText'
import { MuteToggle } from '../objects/MuteToggle'
import { PipePair } from '../objects/PipePair'
import { Player } from '../objects/Player'
import { openLivesPurchaseMenu } from '../scenes/LivesPurchaseMenu'
import { changeBackgroundStyle } from '../util/dom'
import { Rain } from '../weather/Rain'

const speedEarth = 0.26 * 3.5

export class Game extends Phaser.Scene {
	player: Player
	pipes: Phaser.GameObjects.Group
	pipePairs: PipePair[] = []

	score: MagoText
	currentScore: number = 0
	tapCount: number = 0

	intro?: Phaser.GameObjects.Image
	introText?: MagoText
	introContainer?: Phaser.GameObjects.Container

	isGameStarted: boolean = false

	spotLight: Phaser.GameObjects.Light

	pipeCount: number
	pipeGap: PipeGaps = PipeGaps.DEFAULT

	isPipeKeyActive: boolean = false
	isLightsOut: boolean = false
	pixelateFilter?: Phaser.Filters.Pixelate
	private lightsOutTimer?: Phaser.Time.TimerEvent
	private lightsOutCanvasDarkened = false
	private pipeSpawnTimer?: Phaser.Time.TimerEvent
	private pipeFirstSpawnTimer?: Phaser.Time.TimerEvent

	earth: Phaser.GameObjects.TileSprite

	rain: Rain
	fireworks: FireworksManager
	personalHighscore = 0
	isFirstDailyRun = false
	hasBeatenPersonalHighscore = false
	gameplayLayout!: GameplayLayout
	livesHud?: LivesHud
	muteToggle?: MuteToggle
	private unsubscribeAppData?: () => void

	constructor() {
		super('Game')
	}

	create() {
		this.gameplayLayout = getGameplayLayout(this)

		this.isGameStarted = false
		this.pipeCount = 0
		this.pipePairs = []
		this.tapCount = 0
		this.isPipeKeyActive = false
		this.pipeGap = PipeGaps.DEFAULT
		this.stopPipeSpawning()

		this.rain = new Rain(this)
		this.fireworks = new FireworksManager(this)

		const you = this.registry.get('community:you') as { highscore: number; attempts: number } | undefined
		this.personalHighscore = you?.highscore ?? 0
		this.isFirstDailyRun = (you?.attempts ?? 0) === 0
		this.hasBeatenPersonalHighscore = false

		// this.sound.stopByKey('Junkala_Select_2')
		this.sound.stopByKey('Junkala_Stake_2')

		if (shouldAutoplayMusic()) {
			this.sound.play('Junkala_Stake_2', { volume: 0.05, loop: true })
		}

		this.spotLight = this.lights.addLight(400, 300, 280).setIntensity(3)
		const earthH = 32 * this.gameplayLayout.scaleY
		this.earth = this.add
			.tileSprite(this.gameplayLayout.width, this.gameplayLayout.height - earthH, this.gameplayLayout.width, earthH, 'earth')
			.setScale(5)
			.setDepth(50)

		this.physics.add.existing(this.earth)
			; (this.earth.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)
			; (this.earth.body as Phaser.Physics.Arcade.Body).setImmovable(true)

		this.start = this.start.bind(this)
		this.hitPipe = this.hitPipe.bind(this)
		this.addPipeRow = this.addPipeRow.bind(this)

		this.player = new Player(this, this.gameplayLayout.playerStartX, this.gameplayLayout.playerStartY)
		this.pipes = this.physics.add.group()

		this.physics.add.overlap(this.player, this.pipes, this.hitPipe, undefined, this)
		this.physics.add.overlap(this.player, this.earth, this.hitPipe, undefined, this)
			; (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)

		const { scaleX, scaleY } = this.gameplayLayout
		this.createIntroHint(scaleX, scaleY)
		this.score = new MagoText(this, layoutWidth(this) / 2, 12, '0', 121).setDepth(100).setOrigin(0.5, 0)

		const lives = readLivesFromRegistry(this)
		this.livesHud = new LivesHud(this, lives)
		this.muteToggle = new MuteToggle(this)

		this.physics.world.setBounds(0, 0, layoutWidth(this), layoutHeight(this))

		this.input.on('pointerdown', () => {
			if (!this.isGameStarted) {
				if (readLivesFromRegistry(this).count <= 0) {
					openLivesPurchaseMenu(this)
					return
				}
				this.start()
			}
			this.tapCount++
			this.player.flap()
		})

		this.scale.on('resize', this.resize, this)
		this.unsubscribeAppData = birbBridge.onAppData((appData) => {
			this.registry.set('lives', appData.lives)
			this.livesHud?.setLives(appData.lives)
		})

		this.resetScore()
		this.resize()
	}

	shutdown() {
		this.fireworks?.stop()
		this.unsubscribeAppData?.()
		this.scale.off('resize', this.resize, this)
	}

	createIntroHint(scaleX: number, scaleY: number) {
		const cursorRestX = 100 * scaleX
		const cursorRestY = 80 * scaleY
		const cursorTapX = 28 * scaleX
		const cursorTapY = 18 * scaleY

		this.introContainer = this.add.container(this.player.x, this.player.y).setDepth(100)

		this.introText = new MagoText(this, 0, 75 * scaleY, 'Tap', 72).setOrigin(0.5)
		this.intro = this.add
			.image(cursorRestX, cursorRestY, 'Icon_Cursor_02a')
			.setScale(3)
			.setOrigin(0.15, 0.1)

		this.introContainer.add([this.introText, this.intro])

		this.tweens.add({
			targets: this.intro,
			x: cursorTapX,
			y: cursorTapY,
			scale: 2.45,
			angle: -10,
			duration: 360,
			ease: 'Quad.easeIn',
			yoyo: true,
			repeat: -1,
			hold: 140,
		})

		this.tweens.add({
			targets: this.introText,
			alpha: 0.45,
			scaleX: 1.06,
			scaleY: 1.06,
			duration: 720,
			ease: 'Sine.easeInOut',
			yoyo: true,
			repeat: -1,
		})
	}

	syncIntroHintPosition() {
		this.introContainer?.setPosition(this.player.x, this.player.y)
	}

	destroyIntroHint() {
		if (this.intro) this.tweens.killTweensOf(this.intro)
		if (this.introText) this.tweens.killTweensOf(this.introText)
		this.introContainer?.destroy(true)
		this.introContainer = undefined
		this.intro = undefined
		this.introText = undefined
	}

	update() {
		if (this.isGameStarted) {
			this.player.updateBirb()
		}

		this.earth.setTilePosition(this.earth.tilePositionX + speedEarth * this.gameplayLayout.scaleX)
		const pipeSpeed = this.gameplayLayout.pipeScrollSpeed
		const despawnX = -this.gameplayLayout.pipeWidth
		for (let pipePair of this.pipePairs) {
			pipePair.setX(pipePair.x - pipeSpeed)

			if (pipePair.x < despawnX) {
				pipePair.topPipe.destroy(true)
				pipePair.bottomPipe.destroy(true)
				pipePair.destroy(true)
			}
		}
	}

	start() {
		if (this.isGameStarted) return
		this.isGameStarted = true
			; (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true)
		this.startPipeTimer()
		this.destroyIntroHint()
	}

	resize() {
		this.gameplayLayout = getGameplayLayout(this)
		const { width, height, playerStartX, playerStartY, scaleY } = this.gameplayLayout
		const earthH = 32 * scaleY

		this.physics.world.setBounds(0, 0, width, height)
		this.earth.setPosition(width, height - earthH)
		this.earth.setSize(width, earthH)

		this.score.setPosition(width / 2, 12)
		this.livesHud?.layout()
		this.muteToggle?.layout()
		if (!this.isGameStarted) {
			this.player.setPosition(playerStartX, playerStartY)
			this.syncIntroHintPosition()
		}
	}

	startPipeTimer() {
		this.stopPipeSpawning()

		// `startAt` pre-fills elapsed time — it is NOT a pre-delay. Values > delay spawn multiple pipes at once.
		this.pipeFirstSpawnTimer = this.time.delayedCall(this.gameplayLayout.pipeFirstSpawnDelayMs, () => {
			this.addPipeRow()
			this.pipeSpawnTimer = this.time.addEvent({
				delay: this.gameplayLayout.pipeSpawnDelayMs,
				callback: this.addPipeRow,
				callbackScope: this,
				loop: true,
			})
		})
	}

	stopPipeSpawning() {
		this.pipeFirstSpawnTimer?.remove()
		this.pipeFirstSpawnTimer = undefined
		this.pipeSpawnTimer?.remove()
		this.pipeSpawnTimer = undefined
	}

	addPipeRow() {
		if (this.isGameStarted) {
			this.pipePairs.push(new PipePair(this, this.gameplayLayout.pipeSpawnX))
			this.pipeCount++
		}
	}

	hitPipe() {
		this.gameOver()
	}

	incrementScore(score: number = 1) {
		this.currentScore += score
		this.score.setText(this.currentScore.toString())
		this.tryStartPersonalHighscoreFireworks()
	}

	tryStartPersonalHighscoreFireworks = (): void => {
		if (this.hasBeatenPersonalHighscore || this.currentScore <= this.personalHighscore) return
		this.hasBeatenPersonalHighscore = true
		if (this.isFirstDailyRun) return
		this.fireworks.playBurst(FIREWORK_BURST_COUNT)
	}

	resetScore() {
		this.currentScore = 0
		this.score.setText(this.currentScore.toString())
	}

	gameOver() {
		this.cameras.main.shake(350, 0.02)
		this.input.off('pointerdown')
		this.stopPipeSpawning()
		this.player.die()
		this.pipeCount = 0
		this.physics.pause()
		this.rain.stop()
		this.cleanUpLightsOutEffects()
		if (this.pixelateFilter) {
			this.cameras.main.filters.internal.remove(this.pixelateFilter)
			this.pixelateFilter = undefined
		}
		this.isPipeKeyActive = false

		void this.submitScore()
	}

	hideTopHud = (): void => {
		this.livesHud?.setVisible(false)
		this.muteToggle?.setVisible(false)
	}

	async submitScore() {
		const you = this.registry.get('community:you') as { highscore: number; attempts: number } | undefined
		const fallbackHighscore = you?.highscore ?? 0
		const fallbackAttempts = (you?.attempts ?? 0) + 1
		const livesBefore = readLivesFromRegistry(this).count

		try {
			const dailyNumber = getDailyNumber()
			if (dailyNumber === undefined) {
				throw new Error('Missing dailyNumber on daily post')
			}
			const result = await saveScore({
				dailyNumber,
				score: this.currentScore,
				taps: this.tapCount,
			})
			this.registry.set('lives', result.lives)
			this.scale.off('resize', this.resize, this)
			this.hideTopHud()
			this.scene.run('GameOver', {
				isNewHighScore: result.isNewHighScore,
				newScore: this.currentScore,
				highscore: result.highscore,
				attempts: result.attempts,
				taps: this.tapCount,
				livesBefore,
				livesAfter: result.lives.count,
				lives: result.lives,
			})
		} catch (error) {
			clientLogger.error('Failed to save score', error)
			const isNewHighScore = this.currentScore > fallbackHighscore
			const fallbackLives = readLivesFromRegistry(this)
			this.scale.off('resize', this.resize, this)
			this.hideTopHud()
			this.scene.run('GameOver', {
				isNewHighScore,
				newScore: this.currentScore,
				highscore: isNewHighScore ? this.currentScore : fallbackHighscore,
				attempts: fallbackAttempts,
				taps: this.tapCount,
				livesBefore,
				livesAfter: Math.max(0, livesBefore - 1),
				lives: { ...fallbackLives, count: Math.max(0, livesBefore - 1) },
			})
		}
	}

	lightsOut() {
		this.lights.enable()
		this.lights.setAmbientColor(0x222222)

		this.isLightsOut = true

		this.player.setLighting(true)
		this.earth.setLighting(true)

		for (const pipe of this.pipes.getChildren()) {
			const slice = pipe as Phaser.GameObjects.NineSlice
			if (!slice.active) continue
			slice.setAlpha(0.15)
		}

		this.sound.play('lightsout', { volume: 0.3 })

		const canvasParent = document.querySelector('#game-container > canvas')

		if (canvasParent && canvasParent instanceof HTMLCanvasElement) {
			const currentBackground = window.getComputedStyle(canvasParent).background.toString()
			const darkenBackground = 'linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)),' + currentBackground
			canvasParent.style.background = darkenBackground
			this.lightsOutCanvasDarkened = true
		}

		this.events.on('update', this.onPointerMoveLightsOuts, this)
		this.lightsOutTimer?.remove(false)
		this.lightsOutTimer = this.time.delayedCall(6000, this.cleanUpLightsOutEffects, undefined, this)
	}

	cleanUpLightsOutEffects() {
		if (!this.isLightsOut) return

		this.lightsOutTimer?.remove(false)
		this.lightsOutTimer = undefined

		this.lights.disable()
		this.isLightsOut = false

		if (this.player.active) {
			this.player.setLighting(false)
		}
		if (this.earth.active) {
			this.earth.setLighting(false)
		}

		for (const pipe of this.pipes.getChildren()) {
			const slice = pipe as Phaser.GameObjects.NineSlice
			if (!slice.active) continue
			slice.setAlpha(1)
		}

		if (this.lightsOutCanvasDarkened) {
			changeBackgroundStyle(this.registry.get('background'))
			this.lightsOutCanvasDarkened = false
		}

		this.events.off('update', this.onPointerMoveLightsOuts, this)
	}

	onPointerMoveLightsOuts() {
		this.spotLight.setPosition(this.player.x, this.player.y)
	}

	pixelate() {
		const camera = this.cameras.main
		this.pixelateFilter = camera.filters.internal.addPixelate(0)
		this.sound.play('pixelate', { volume: 0.3 })
		this.tweens.add({
			targets: this.pixelateFilter,
			amount: 7,
			duration: 1000,
			callbackScope: this,
			onComplete: () => {
				this.time.delayedCall(4000, () => {
					this.tweens.add({
						targets: this.pixelateFilter,
						amount: 1,
						duration: 1000,
						onComplete: () => {
							if (this.pixelateFilter) {
								camera.filters.internal.remove(this.pixelateFilter)
								this.pixelateFilter = undefined
							}
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
			scale: BIRB_DISPLAY_SCALE * 0.6,
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
				scale: BIRB_DISPLAY_SCALE,
				duration: 400,
			})
		})
	}

	pickupEmerald() {
		const relativePan = Phaser.Math.Clamp((this.player.x / layoutWidth(this)) * 2 - 1, -0.4, 0.4)
		const randomPitch = Phaser.Math.FloatBetween(0.99, 1.01)
		this.sound.play(`Pickup_Coin_${Phaser.Math.Between(0, 3)}`, {
			pan: relativePan,
			rate: randomPitch,
			volume: 0.2,
		})
		this.incrementScore(5)
	}

	pickUpSapphire() {
		const relativePan = Phaser.Math.Clamp((this.player.x / layoutWidth(this)) * 2 - 1, -0.4, 0.4)
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
