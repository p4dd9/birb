import type { Game } from '../scenes/Game'

export class Rain {
	scene: Game
	tileSprite: Phaser.GameObjects.TileSprite

	currentFrame = 0
	speed = 80
	lastFrameTime = 0

	isRunning: boolean = false

	constructor(scene: Game) {
		this.scene = scene

		this.create()
	}

	create() {
		this.tileSprite = this.scene.add
			.tileSprite(
				this.scene.scale.width / 2,
				this.scene.scale.height / 2,
				this.scene.scale.width,
				this.scene.scale.height,
				'rain_light_32x128',
				0
			)
			.setScale(3)
			.setAngle(20)
			.setDepth(30)
			.setVisible(false)
	}

	start() {
		this.scene.events.on('update', this.update, this)
		this.tileSprite.setVisible(true)
		this.isRunning = true
	}

	stop() {
		this.isRunning = false
		this.scene.events.off('update', this.update, this)
		this.tileSprite.setVisible(false)
	}

	toggle() {
		if (this.isRunning) {
			this.stop()
		} else {
			this.start()
		}
	}

	update(time: number, _delta: number) {
		if (time > this.lastFrameTime + this.speed) {
			this.lastFrameTime = time
			this.currentFrame = (this.currentFrame + 1) % 8
			this.tileSprite.setFrame(this.currentFrame)
		}

		this.tileSprite.tilePositionY -= 1
	}
}
