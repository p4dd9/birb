import { PipePair } from './PipePair'
import { Player } from './Player'

export class Game extends Phaser.Scene {
	player!: Player
	pipes!: Phaser.GameObjects.Group

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

		this.input.on('pointerdown', this.flap)
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

	gameOver() {
		this.physics.pause()
		this.player.setTint(0xff0000)
		this.add.text(400, 300, 'Game Over', { fontSize: '64px' }).setOrigin(0.5)
		this.input.once('pointerdown', () => {
			this.scene.restart()
		})
	}
}
