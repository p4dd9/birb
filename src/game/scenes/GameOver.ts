export class GameOver extends Phaser.Scene {
	gameOverText: Phaser.GameObjects.Text
	replayButton: Phaser.GameObjects.Image
	replayButtonText: Phaser.GameObjects.Text

	personalHighscoreText: Phaser.GameObjects.Text

	constructor() {
		super('GameOver')
	}

	create(data: { isNewHighScore: boolean; newScore: number; highscore: number }) {
		const centerX = this.scale.width / 2
		const centerY = this.scale.height / 2

		console.log(data)
		const { isNewHighScore, newScore, highscore } = data

		this.gameOverText = this.add
			.text(centerX, centerY - 70, 'Game Over', {
				fontSize: 172,
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)

		this.personalHighscoreText = this.add
			.text(50, this.scale.height - 50, `Personal Highscore: ${highscore}`, {
				fontSize: 72,
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0, 1)

		this.replayButton = this.add
			.image(centerX, centerY + 120, 'UI_Flat_Frame03a')
			.setDisplaySize(this.gameOverText.displayWidth / 2, 100)
			.setOrigin(0.5)
		this.replayButtonText = this.add
			.text(centerX, centerY + 105, 'Restart', {
				fontSize: '82px',
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				this.scene.start('Game')
			})

		this.scale.on('resize', this.resize, this)
	}

	resize() {
		this.gameOverText.setPosition(this.scale.width / 2, this.scale.height / 2 - 70)
		this.replayButton.setPosition(this.scale.width / 2, this.scale.height / 2 + 120)
		this.replayButtonText.setPosition(this.scale.width / 2, this.scale.height / 2 + 105)
		this.personalHighscoreText.setPosition(50, this.scale.height - 50)
	}
}
