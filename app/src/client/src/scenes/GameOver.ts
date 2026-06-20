import { bindSceneCameraScale, layoutHeight, layoutWidth } from '../cameraScale'
import { BIRB_CURSOR } from '../util/dom'
import { MagoText } from '../objects/MagoText'

export class GameOver extends Phaser.Scene {
	replayButton: Phaser.GameObjects.Image
	replayButtonText: MagoText

	personalHighscoreText: MagoText

	constructor() {
		super('GameOver')
	}

	create(data: { isNewHighScore: boolean; newScore: number; highscore: number; attempts: number }) {
		bindSceneCameraScale(this)

		const centerX = layoutWidth(this) / 2
		const centerY = layoutHeight(this) / 2
		const buttonWidth = Math.min(layoutWidth(this) * 0.4, 280)

		const { isNewHighScore, highscore } = data

		if (isNewHighScore) {
			this.sound.play('victory', { volume: 0.2 })
		}

		this.replayButton = this.add
			.image(centerX, centerY, 'UI_Flat_Frame03a')
			.setDisplaySize(buttonWidth, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: BIRB_CURSOR })
			.once('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.scale.off('resize', this.resize, this)
				this.scene.start('Game')
			})

		this.replayButtonText = new MagoText(this, centerX, this.replayButton.y, 'Restart', 72)

		this.personalHighscoreText = new MagoText(
			this,
			50,
			layoutHeight(this) - 25,
			`Highscore: ${highscore}`,
			72
		).setOrigin(0, 1)

		this.scale.on('resize', this.resize, this)
		this.resize()
	}

	resize() {
		const centerX = layoutWidth(this) / 2
		const centerY = layoutHeight(this) / 2
		const buttonWidth = Math.min(layoutWidth(this) * 0.4, 280)

		this.replayButton.setPosition(centerX, centerY)
		this.replayButton.setDisplaySize(buttonWidth, 100)
		this.replayButtonText.setPosition(this.replayButton.x, this.replayButton.y)

		this.personalHighscoreText.setPosition(50, layoutHeight(this) - 25)
	}
}
