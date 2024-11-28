import { Player } from './Player'

export class Game extends Phaser.Scene {
	player!: Player
	pipes!: Phaser.GameObjects.Group

	constructor() {
		super('Game')
	}

	preload() {
		// load stuff
	}

	create() {
		this.add.text(200, 200, 'This is Phaser within Reddit!', { color: 'red', fontSize: 72 })
		this.add.text(200, 300, `It's HAMMER TIME!`, { color: 'white', fontSize: 72 })

		this.flap = this.flap.bind(this)
		this.hitPipe = this.hitPipe.bind(this)
		this.addPipeRow = this.addPipeRow.bind(this)

		this.player = new Player(this, 200, 200)
		this.pipes = this.physics.add.group()
		this.physics.add.collider(this.player, this.pipes, this.hitPipe, undefined, this)

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

	addPipeRow() {}

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
