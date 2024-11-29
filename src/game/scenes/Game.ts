import type { SaveStatsMessage } from '../../shared/messages'
import { PipePair } from '../objects/PipePair'
import { Player } from '../objects/Player'
import { PrimaryText } from '../objects/PrimaryText'

export class Game extends Phaser.Scene {
	player: Player
	pipes: Phaser.GameObjects.Group
	score: PrimaryText
	intro: Phaser.GameObjects.Image

	currentScore: number = 0
	isGameStarted: boolean = false

	constructor() {
		super('Game')
	}

	create() {
		this.isGameStarted = false

		this.flap = this.flap.bind(this)
		this.start = this.start.bind(this)
		this.hitPipe = this.hitPipe.bind(this)
		this.addPipeRow = this.addPipeRow.bind(this)

		this.player = new Player(this, 200, 300)
		this.pipes = this.physics.add.group()

		this.physics.add.overlap(this.player, this.pipes, this.hitPipe, undefined, this)
		;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false)

		this.intro = this.add.image(this.player.x + 100, this.player.y + 100, 'Icon_Cursor_02a').setScale(3)
		this.score = new PrimaryText(this, this.scale.width / 2, -20, '0', {
			fontSize: 121,
		})
			.setDepth(100)
			.setOrigin(0.5, 0)

		this.input.on('pointerdown', this.start)

		this.input.on('pointerdown', this.flap)
		this.scale.on('resize', this.resize, this)

		this.resetScore()
	}

	start() {
		if (this.isGameStarted) return
		this.isGameStarted = true
		;(this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true)
		this.startPipeTimer()

		this.intro.destroy()
	}

	saveStats() {
		let message: SaveStatsMessage = {
			type: 'saveStats',
			data: {
				personal: { highscore: this.currentScore },
			},
		}
		window.parent?.postMessage(message, '*')
	}

	resize() {
		this.score.setX(this.scale.width / 2)
	}

	flap() {
		if (this.isGameStarted) {
			this.player.setVelocityY(-300)
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
		this.physics.pause()
		this.player.setTint(0xff0000)
		this.scene.pause()
		this.saveStats()
		this.scene.run('GameOver')
	}
}
