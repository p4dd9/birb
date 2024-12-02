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

	constructor() {
		super('Game')
	}

	create() {
		this.isGameStarted = false

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

		this.input.on('pointerdown', this.start)

		this.input.on('pointerdown', this.player.flap)
		this.scale.on('resize', this.resize, this)

		this.input.keyboard?.createCombo('bird', {
			resetOnWrongKey: true,
			resetOnMatch: true,
			deleteOnMatch: false,
		})
		this.input.keyboard?.on('keycombomatch', () => {
			this.player.changeToRandomBird()
		})

		this.resetScore()
	}

	override update(_time: number, _delta: number) {
		if (this.isGameStarted) {
			this.player.updateBird()
		}
	}

	start() {
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
			delay: 1500,
			callback: this.addPipeRow,
			callbackScope: this,
			loop: true,
		})
	}

	addPipeRow() {
		if (this.isGameStarted) {
			const pipeHeight = Phaser.Math.Between(100, 400)
			new PipePair(this, this.cameras.main.width + 50, pipeHeight)
		}
	}

	hitPipe() {
		this.gameOver()
	}

	incrementScore() {
		this.currentScore++
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

		globalEventEmitter.emit('saveStats', this.currentScore)
		globalEventEmitter.once(
			'gameOver',
			(data: { isNewHighscore: boolean; newScore: number; highscore: number; attempts: number }) => {
				this.scene.run('GameOver', data)
			}
		)
	}
}
