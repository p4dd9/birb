import type { Game } from '../scenes/Game'
import { layoutHeight, layoutWidth } from '../cameraScale'

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
				layoutWidth(this.scene) / 2,
				layoutHeight(this.scene) / 2,
				layoutWidth(this.scene),
				layoutHeight(this.scene),
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
