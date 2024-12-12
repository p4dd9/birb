import type { AppData, RedisPlayer } from '../../shared/messages'
import { MagoText } from '../objects/MagoText'
import { MenuContent } from '../objects/MenuContent'
import globalEventEmitter from '../web/GlobalEventEmitter'

export class Menu extends Phaser.Scene {
	personalHighscoreText: MagoText
	muteButtonText: MagoText

	isMute: boolean = false

	bestPlayer: MagoText

	breakingNews: Phaser.GameObjects.BitmapText
	playersOnline: Phaser.GameObjects.BitmapText

	menuContent: MenuContent

	constructor() {
		super('Menu')
	}

	create() {
		this.scene.remove('Boot')

		if (this.cameras.main.postFX) {
			this.cameras.main.postFX.clear()
		}

		this.sound.stopByKey('Junkala_Stake_2')
		if (!this.sound.get('Junkala_Select_2')?.isPlaying) {
			this.sound.play('Junkala_Select_2', { loop: true, volume: 0.05 })
		}

		// TODO: think about ui, customization per player + community goal
		this.playersOnline = new MagoText(
			this,
			50,
			this.scale.height - 25,
			`Online: ${this.registry.get('community:online')}`,
			72
		).setOrigin(0, 1)

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

		globalEventEmitter.on('updateOnlinePlayers', this.updateOnlinePlayers, this)
		globalEventEmitter.once('startGame', () => {
			this.sound.play('buttonclick1', { volume: 0.5 })
			this.scale.off('resize', this.resize, this)
			globalEventEmitter.off('updateOnlinePlayers', this.updateOnlinePlayers, this)
			globalEventEmitter.off('updateAppData', this.updateAppData, this)
			this.scene.start('Game')
		})

		this.menuContent = new MenuContent(this)

		this.createBreakingNews()
		this.createBestPlayer()

		this.scale.on('resize', this.resize, this)

		globalEventEmitter.on('updateAppData', this.updateAppData, this)
	}

	updateAppData(appData: AppData) {
		this.menuContent.updateData(appData)
		this.breakingNews.setText(this.getBreakingNewsText(appData.community.leaderboard))
		this.bestPlayer.setText(this.getFeaturedPlayerText(appData.community.leaderboard[0]))
	}

	updateOnlinePlayers(data: { count: number }) {
		if (this && this.playersOnline && data && data.count) {
			this.playersOnline.setText(`Online: ${data.count}`)
		}
	}

	getBreakingNewsText(players: RedisPlayer[]) {
		const topPlayers = players.map((player) => `"${player.userName}" ${player.score}`).join(',')
		let bannerText = `*LIVE* BREAKING SCORES! ${topPlayers} *LIVE*`
		if (players.length < 1) {
			bannerText = `*LIVE* OHH BOI! STRANGER IS FIRST IN LINE TO BIRD UP! GOOD LUCK! *LIVE*`
		}
		return bannerText
	}

	createBreakingNews() {
		const bannerText = this.getBreakingNewsText(this.registry.get('community:leaderboard'))

		this.breakingNews = new MagoText(this, this.scale.width, 20, bannerText, 100).setOrigin(0, 0)

		this.startBreakingTheNews()
	}

	getFeaturedPlayerText(bestPlayer?: RedisPlayer) {
		let text = `Let's play Reddibirds!!!`
		if (bestPlayer) {
			text = `${bestPlayer.userName}: ${bestPlayer.score}`
		}
		return text
	}

	createBestPlayer() {
		this.bestPlayer = new MagoText(
			this,
			450,
			this.scale.height - 200,
			this.getFeaturedPlayerText(this.registry.get('community:leaderboard')[0]),
			72
		)
			.setAngle(10)
			.setName('menu_bestplayer')

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
		this.muteButtonText.setPosition(this.scale.width - 50, this.scale.height - 25)
		this.playersOnline.setPosition(50, this.scale.height - 25)
		this.menuContent.setPosition(this.scale.width / 2, this.scale.height / 2 - 100)

		if (this.breakingNews) {
			this.breakingNews.setPosition(this.scale.width, 20)
		}

		if (this.bestPlayer) {
			this.bestPlayer.setPosition(450, this.scale.height - 200)
		}
	}
}
