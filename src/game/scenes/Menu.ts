export class Menu extends Phaser.Scene {
	gameTitleText: Phaser.GameObjects.Text

	playButton: Phaser.GameObjects.Image
	playButtonText: Phaser.GameObjects.Text

	scoreBoardButton: Phaser.GameObjects.Image
	scoreBoardButtonText: Phaser.GameObjects.Text

	personalHighscoreText: Phaser.GameObjects.Text
	muteButtonText: Phaser.GameObjects.Text

	isMute: boolean = false

	constructor() {
		super('Menu')
	}

	create() {
		const centerX = this.scale.width / 2
		const centerY = this.scale.height / 2

		this.gameTitleText = this.add
			.text(centerX, centerY - 155, 'REDDIBIRDS', {
				fontSize: 172,
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)

		this.playButton = this.add
			.image(centerX, this.gameTitleText.y + 170, 'UI_Flat_Frame03a')
			.setDisplaySize(this.gameTitleText.displayWidth / 2, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				this.scene.start('Game')
			})
		this.playButtonText = this.add
			.text(centerX, this.playButton.y - 15, 'Play', {
				fontSize: '82px',
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)

		this.scoreBoardButton = this.add
			.image(centerX, this.playButton.y + 130, 'UI_Flat_Frame03a')
			.setDisplaySize(this.gameTitleText.displayWidth / 2, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				this.scene.start('Game')
			})
		this.scoreBoardButtonText = this.add
			.text(centerX, this.scoreBoardButton.y - 15, 'Scores', {
				fontSize: '82px',
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(0.5)

		this.muteButtonText = this.add
			.text(this.scale.width - 50, this.scale.height - 50, this.getMuteButtonText(), {
				fontSize: 72,
				fontFamily: 'mago3',
				color: 'black',
			})
			.setOrigin(1, 1)
			.setInteractive({ cursor: 'pointer' })
			.on('pointerdown', this.toggleMute, this)

		this.scale.on('resize', this.resize, this)
	}

	private getMuteButtonText(): string {
		console.log(this.game.sound.mute)
		return this.isMute ? 'Unmute' : 'Mute'
	}

	private toggleMute(): void {
		if (this.sound.locked) {
			console.warn('Sound system is locked. Waiting for user interaction.')
			return
		}
		this.isMute = !this.game.sound.mute
		this.sound.setMute(!this.game.sound.mute)
		this.muteButtonText.setText(this.getMuteButtonText())
	}

	resize() {
		this.gameTitleText.setPosition(this.scale.width / 2, this.scale.height / 2 - 155)

		this.playButton.setPosition(this.scale.width / 2, this.gameTitleText.y + 170)
		this.playButtonText.setPosition(this.scale.width / 2, this.playButton.y - 15)

		this.scoreBoardButton.setPosition(this.scale.width / 2, this.playButton.y + 130)
		this.scoreBoardButtonText.setPosition(this.scale.width / 2, this.scoreBoardButton.y - 15)

		this.muteButtonText.setPosition(this.scale.width - 50, this.scale.height - 50)
	}
}
