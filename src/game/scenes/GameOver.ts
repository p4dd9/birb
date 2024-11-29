export class GameOver extends Phaser.Scene {
	gameOverText!: Phaser.GameObjects.Text
	replayButton!: Phaser.GameObjects.Image
	replayButtonText!: Phaser.GameObjects.Text

	constructor() {
		super('GameOver')
	}

	preload() {
		// load stuff
	}

	create() {
		const centerX = this.scale.width / 2
		const centerY = this.scale.height / 2

		this.gameOverText = this.add
			.text(centerX, centerY - 70, 'Game Over', {
				fontSize: '172px',
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)

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

		this.input.once('pointerdown', () => {
			this.scene.start('Game')
		})

		this.scale.on('resize', this.resize, this)
	}

	resize() {
		this.gameOverText.setPosition(this.scale.width / 2, this.scale.height / 2 - 70)
		this.replayButton.setPosition(this.scale.width / 2, this.scale.height / 2 + 120)
		this.replayButtonText.setPosition(this.scale.width / 2, this.scale.height / 2 + 105)
	}
}
