import { PipePair } from '../objects/PipePair'
import { Player } from '../objects/Player'
import { PrimaryText } from '../objects/PrimaryText'

export class Game extends Phaser.Scene {
	player!: Player
	pipes!: Phaser.GameObjects.Group
	score!: PrimaryText
	currentScore: number = 0

	constructor() {
		super('Game')
	}

	preload() {
		this.load.spritesheet('birds', 'path/to/birds.png', { frameWidth: 32, frameHeight: 32 })
		this.load.image('pipes', 'path/to/pipes.png')
	}

	create() {
		this.flap = this.flap.bind(this)
		this.hitPipe = this.hitPipe.bind(this)
		this.addPipeRow = this.addPipeRow.bind(this)

		this.player = new Player(this, 200, 300)
		this.pipes = this.physics.add.group()

		this.physics.add.overlap(this.player, this.pipes, this.hitPipe, undefined, this)

		this.startPipeTimer()

		this.score = new PrimaryText(this, this.scale.width / 2, -20, '0', {
			fontSize: 121,
		})
			.setDepth(100)
			.setOrigin(0.5, 0)

		this.input.on('pointerdown', this.flap)
		this.scale.on('resize', this.resize, this)
	}

	resize() {
		this.score.setX(this.scale.width / 2)
	}

	flap() {
		this.player.setVelocityY(-300)
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
		const pipeHeight = Phaser.Math.Between(100, 400)
		new PipePair(this, this.cameras.main.width + 50, pipeHeight)
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
		this.scene.run('GameOver')
	}
}
