import type { Player } from '../../shared/messages'
import globalEventEmitter from '../web/GlobalEventEmitter'

export class Menu extends Phaser.Scene {
	gameTitleText: Phaser.GameObjects.Text

	playButton: Phaser.GameObjects.Image
	playButtonText: Phaser.GameObjects.Text

	personalHighscoreText: Phaser.GameObjects.Text
	muteButtonText: Phaser.GameObjects.Text

	isMute: boolean = false

	bestPlayer: Phaser.GameObjects.Text

	breakingNews: Phaser.GameObjects.Text

	constructor() {
		super('Menu')
	}

	create() {
		const centerX = this.scale.width / 2
		const centerY = this.scale.height / 2

		globalEventEmitter.once('updateBestPlayer', (bestPlayer: Player) => {
			this.bestPlayer = this.add
				.text(250, this.scale.height - 250, `${bestPlayer.userName}: ${bestPlayer.score}`, {
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
			const bannerText = bestPlayers.map((player) => `"${player.userName}" ${player.score}`).join(' - ')
			this.breakingNews = this.add
				.text(this.scale.width, 0, `*LIVE* BREAKING SCORES! ${bannerText} *LIVE*`, {
					fontSize: 100,
					color: 'black',
					fontFamily: 'mago3',
				})
				.setOrigin(0, 0)

			this.startBreakingNews()
		})

		this.gameTitleText = this.add
			.text(centerX, centerY - 110, 'REDDIBIRDS', {
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

	startBreakingNews() {
		this.add.tween({
			targets: this.breakingNews,
			x: -this.breakingNews.displayWidth,
			duration: 9000,
			repeat: 0,
			onComplete: () => {
				this.breakingNews.x = this.scale.width
				this.startBreakingNews()
			},
		})
	}

	getMuteButtonText(): string {
		return this.isMute ? 'Unmute' : 'Mute'
	}

	toggleMute(): void {
		if (this.sound.locked) {
			console.warn('Sound system is locked. Waiting for user interaction.')
			return
		}
		this.isMute = !this.game.sound.mute
		this.sound.setMute(!this.game.sound.mute)
		this.muteButtonText.setText(this.getMuteButtonText())
	}

	resize() {
		this.gameTitleText.setPosition(this.scale.width / 2, this.scale.height / 2 - 110)

		this.playButton.setPosition(this.scale.width / 2, this.gameTitleText.y + 170)
		this.playButtonText.setPosition(this.scale.width / 2, this.playButton.y - 15)

		this.muteButtonText.setPosition(this.scale.width - 50, this.scale.height - 50)
	}
}
