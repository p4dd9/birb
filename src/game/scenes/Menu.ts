import type { Player } from '../../shared/messages'
import globalEventEmitter from '../web/GlobalEventEmitter'

export class Menu extends Phaser.Scene {
	gameTitleText: Phaser.GameObjects.Text

	playButton: Phaser.GameObjects.Image
	playButtonText: Phaser.GameObjects.Text

	scoreBoardButton: Phaser.GameObjects.Image
	scoreBoardButtonText: Phaser.GameObjects.Text

	personalHighscoreText: Phaser.GameObjects.Text
	muteButtonText: Phaser.GameObjects.Text

	isMute: boolean = false

	bestPlayer: Phaser.GameObjects.Text

	private banner1: Phaser.GameObjects.Text
	private banner2: Phaser.GameObjects.Text
	private bannerWidth: number
	private scrollSpeed: number

	constructor() {
		super('Menu')
	}

	override update(_time: number, delta: number) {
		if (!this.banner1 || !this.banner2) {
			return
		}
		this.banner1.x -= this.scrollSpeed * (delta / 1000)
		this.banner2.x -= this.scrollSpeed * (delta / 1000)

		if (this.banner1.x + this.bannerWidth < 0) {
			this.banner1.x = this.banner2.x + this.bannerWidth
		}
		if (this.banner2.x + this.bannerWidth < 0) {
			this.banner2.x = this.banner1.x + this.bannerWidth
		}
	}
	create() {
		const centerX = this.scale.width / 2
		const centerY = this.scale.height / 2

		globalEventEmitter.once('updateBestPlayer', (bestPlayer: Player) => {
			console.log(bestPlayer)
			this.bestPlayer = this.add
				.text(250, this.scale.height - 250, `${bestPlayer.userId}: ${bestPlayer.score}`, {
					fontSize: 72,
					fontFamily: 'mago3',
					color: 'black',
				})
				.setOrigin(0.5, 0.5)
				.setAngle(42)
			this.add.tween({
				targets: this.bestPlayer,
				scale: 1.1,
				yoyo: true,
				duration: 1000,
				repeat: -1,
			})
		})

		globalEventEmitter.once('updateBestPlayers', (bestPlayers: Player[]) => {
			console.log(bestPlayers)

			const bannerText = bestPlayers
				.map((player) => `Player: ${player.userId}, Score: ${player.score}`)
				.join('   ||   ')

			this.banner1 = this.add.text(0, 50, bannerText, {
				font: '24px Arial',
				color: '#ffffff',
				backgroundColor: '#000000',
				padding: { left: 10, right: 10, top: 5, bottom: 5 },
			})
			this.banner2 = this.add.text(this.banner1.width, 50, bannerText, {
				font: '24px Arial',
				color: '#ffffff',
				backgroundColor: '#000000',
				padding: { left: 10, right: 10, top: 5, bottom: 5 },
			})

			this.banner1.setOrigin(0, 0.5)
			this.banner2.setOrigin(0, 0.5)

			this.bannerWidth = this.banner1.width

			this.scrollSpeed = 100
		})

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

		globalEventEmitter.emit('getBestPlayer')
		globalEventEmitter.emit('getBestPlayers')

		this.scale.on('resize', this.resize, this)
	}

	private getMuteButtonText(): string {
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
