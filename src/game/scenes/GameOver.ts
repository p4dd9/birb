import { MagoText } from '../objects/MagoText'

export class GameOver extends Phaser.Scene {
	gameOverText: MagoText

	replayButton: Phaser.GameObjects.Image
	replayButtonText: MagoText

	menuButton: Phaser.GameObjects.Image
	menuButtonText: MagoText

	personalHighscoreText: MagoText
	gamesCountText: MagoText

	constructor() {
		super('GameOver')
	}

	create(data: { isNewHighScore: boolean; newScore: number; highscore: number; attempts: number }) {
		const centerX = this.scale.width / 2
		const centerY = this.scale.height / 2

		const { isNewHighScore, newScore, highscore, attempts } = data

		if (isNewHighScore) {
			this.sound.play('victory', { volume: 0.2 })
		}

		this.gameOverText = new MagoText(this, centerX, centerY - 100, 'Game Over', 172)

		this.replayButton = this.add
			.image(centerX, this.gameOverText.y + 150, 'UI_Flat_Frame03a')
			.setDisplaySize(this.gameOverText.displayWidth / 2, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.scale.off('resize', this.resize, this)
				this.scene.start('Game')
			})

		this.replayButtonText = new MagoText(this, centerX, this.replayButton.y, 'Restart', 72)

		this.menuButton = this.add
			.image(centerX, this.replayButtonText.y + 130, 'UI_Flat_Frame03a')
			.setDisplaySize(this.gameOverText.displayWidth / 3, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.scale.off('resize', this.resize, this)
				this.scene.stop('Game')
				this.scene.start('Menu')
			})

		this.menuButtonText = new MagoText(this, centerX, this.menuButton.y, 'Menu', 72)
		this.personalHighscoreText = new MagoText(
			this,
			50,
			this.scale.height - 25,
			`Highscore: ${highscore}`,
			72
		).setOrigin(0, 1)

		this.gamesCountText = new MagoText(
			this,
			this.scale.width - 50,
			this.scale.height - 25,
			`Games: ${attempts}`,
			72
		).setOrigin(1, 1)

		this.scale.on('resize', this.resize, this)
	}

	resize() {
		this.gameOverText.setPosition(this.scale.width / 2, this.scale.height / 2 - 100)

		this.replayButton.setPosition(this.gameOverText.x, this.gameOverText.y + 150)
		this.replayButtonText.setPosition(this.replayButton.x, this.replayButton.y)

		this.menuButton.setPosition(this.replayButton.x, this.replayButtonText.y + 130)
		this.menuButtonText.setPosition(this.menuButton.x, this.menuButton.y)

		this.personalHighscoreText.setPosition(50, this.scale.height - 25)
		this.gamesCountText.setPosition(this.scale.width - 50, this.scale.height - 25)
	}
}
