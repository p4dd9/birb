import type { Player } from '../../shared/messages'
import { MagoText } from '../objects/MagoText'
import globalEventEmitter from '../web/GlobalEventEmitter'

export class Menu extends Phaser.Scene {
	gameTitleText: MagoText

	playButton: Phaser.GameObjects.Image
	playButtonText: Phaser.GameObjects.BitmapText

	personalHighscoreText: MagoText
	muteButtonText: MagoText

	isMute: boolean = false

	bestPlayer: MagoText

	breakingNews: Phaser.GameObjects.BitmapText
	playersOnline: Phaser.GameObjects.BitmapText

	constructor() {
		super('Menu')

		globalEventEmitter.on('updateOnlinePlayers', (data: { count: number }) => {
			if (this.playersOnline) {
				this.playersOnline.setText(`Online: ${data.count}`)
			}
		})
	}

	create() {
		const centerX = this.scale.width / 2
		const centerY = this.scale.height / 2

		this.cameras.main.postFX.clear()

		this.sound.stopByKey('Junkala_Stake_2')
		if (!this.sound.get('Junkala_Select_2')?.isPlaying) {
			this.sound.play('Junkala_Select_2', { loop: true, volume: 0.05 })
		}

		globalEventEmitter.once('updateBestPlayers', (bestPlayers: Player[]) => {
			this.createBreakingNews(bestPlayers)
			this.createBestPlayer(bestPlayers[0])
		})
		globalEventEmitter.emit('getBestPlayers')

		this.gameTitleText = new MagoText(this, centerX, centerY - 110, 'REDDIBIRDS', 172)

		// TODO: think about ui, customization per player + community goal
		this.add
			.sprite(
				this.gameTitleText.x - this.gameTitleText.displayWidth / 2 - 30,
				this.gameTitleText.y - 6,
				'Spritesheet_Animation_UI_Pumpkin_Arrow',
				0
			)
			.setOrigin(1, 0.5)
			.setDisplaySize(64, 64)
			.setVisible(false)

		this.playButton = this.add
			.image(centerX, this.gameTitleText.y + 170, 'UI_Flat_Frame03a')
			.setDisplaySize(this.gameTitleText.displayWidth / 2, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.scale.off('resize', this.resize, this)
				this.scene.start('Game')
			})

		this.playButtonText = this.add.bitmapText(centerX, this.playButton.y, 'mago3_black', 'Play', 82).setOrigin(0.5)
		this.playersOnline = new MagoText(this, 50, this.scale.height - 25, `Online: ?`, 72).setOrigin(0, 1)

		this.muteButtonText = new MagoText(
			this,
			this.scale.width - 50,
			this.scale.height - 25,
			this.getMuteButtonText(),
			72
		)
			.setOrigin(1, 1)
			.setInteractive({ cursor: 'pointer' })
			.on('pointerdown', this.toggleMute, this)

		this.scale.on('resize', this.resize, this)
	}

	createBreakingNews(players: Player[]) {
		const topPlayers = players.map((player) => `"${player.userName}" ${player.score}`).join(',')
		let bannerText = `*LIVE* BREAKING SCORES! ${topPlayers} *LIVE*`
		if (players.length < 1) {
			bannerText = `*LIVE* OHH BOI! STRANGER IS FIRST IN LINE TO BIRD UP! GOOD LUCK! *LIVE*`
		}

		this.breakingNews = new MagoText(this, this.scale.width, 20, bannerText, 100).setOrigin(0, 0)

		this.startBreakingTheNews()
	}

	createBestPlayer(bestPlayer?: Player) {
		let text = `Let's play Reddibirds!!!`
		if (bestPlayer) {
			text = `${bestPlayer.userName}: ${bestPlayer.score}`
		}
		this.bestPlayer = new MagoText(this, 450, this.scale.height - 200, text, 72).setAngle(10)

		this.add.tween({
			targets: this.bestPlayer,
			scale: 1.1,
			yoyo: true,
			duration: 1100,
			repeat: -1,
		})
	}

	startBreakingTheNews() {
		const speed = 400
		const duration = (this.breakingNews.displayWidth / speed) * 1000

		this.add.tween({
			targets: this.breakingNews,
			x: -this.breakingNews.displayWidth,
			duration: duration,
			repeat: 0,
			onComplete: () => {
				this.breakingNews.x = this.scale.width
				this.startBreakingTheNews()
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
		this.sound.play('buttonclick1', { volume: 0.5 })
		this.isMute = !this.game.sound.mute
		this.sound.setMute(!this.game.sound.mute)
		this.muteButtonText.setText(this.getMuteButtonText())
	}

	resize() {
		this.gameTitleText.setPosition(this.scale.width / 2, this.scale.height / 2 - 110)

		this.playButton.setPosition(this.scale.width / 2, this.gameTitleText.y + 170)
		this.playButtonText.setPosition(this.scale.width / 2, this.playButton.y)

		this.muteButtonText.setPosition(this.scale.width - 50, this.scale.height - 25)
		this.playersOnline.setPosition(50, this.scale.height - 25)

		if (this.breakingNews) {
			this.breakingNews.setPosition(this.scale.width, 20)
		}

		if (this.bestPlayer) {
			this.bestPlayer.setPosition(450, this.scale.height - 200)
		}
	}
}
