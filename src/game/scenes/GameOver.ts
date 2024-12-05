export class GameOver extends Phaser.Scene {
	gameOverText: Phaser.GameObjects.Text

	replayButton: Phaser.GameObjects.Image
	replayButtonText: Phaser.GameObjects.Text

	menuButton: Phaser.GameObjects.Image
	menuButtonText: Phaser.GameObjects.Text

	personalHighscoreText: Phaser.GameObjects.Text
	gamesCountText: Phaser.GameObjects.Text

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

		this.gameOverText = this.add
			.text(centerX, centerY - 100, 'Game Over', {
				fontSize: 172,
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)

		this.replayButton = this.add
			.image(centerX, centerY + 120, 'UI_Flat_Frame03a')
			.setDisplaySize(this.gameOverText.displayWidth / 2, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.scene.start('Game')
			})

		this.replayButtonText = this.add
			.text(centerX, centerY + 105, 'Restart', {
				fontSize: '82px',
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)

		this.menuButton = this.add
			.image(centerX, this.replayButtonText.y + 150, 'UI_Flat_Frame03a')
			.setDisplaySize(this.gameOverText.displayWidth / 3, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.scene.stop('Game')
				this.scene.start('Menu')
			})

		this.menuButtonText = this.add
			.text(centerX, this.menuButton.y - 12, 'Menu', {
				fontSize: 72,
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)

		this.personalHighscoreText = this.add
			.text(50, this.scale.height - 50, `Highscore: ${highscore}`, {
				fontSize: 72,
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0, 1)

		this.gamesCountText = this.add
			.text(this.scale.width - 50, this.scale.height - 50, `Games: ${attempts}`, {
				fontSize: 72,
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(1, 1)

		this.scale.on('resize', this.resize, this)
	}

	resize() {
		this.gameOverText.setPosition(this.scale.width / 2, this.scale.height / 2 - 100)

		this.replayButton.setPosition(this.scale.width / 2, this.scale.height / 2 + 120)
		this.replayButtonText.setPosition(this.scale.width / 2, this.scale.height / 2 + 105)

		this.menuButton.setPosition(this.scale.width / 2, this.replayButtonText.y + 150)
		this.menuButtonText.setPosition(this.scale.width / 2, this.menuButton.y - 12)

		this.personalHighscoreText.setPosition(50, this.scale.height - 50)
		this.gamesCountText.setPosition(this.scale.width - 50, this.scale.height - 50)
	}
}
