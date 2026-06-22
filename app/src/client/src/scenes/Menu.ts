import type { AppData, DailyLeaderboardEntry } from '@birb/shared'
import { birbBridge } from '../api/birbBridge'
import { applyAppDataToRegistry, isActiveDailyPost } from '../api/birbClient'
import { bindSceneCameraScale, layoutHeight, layoutWidth } from '../cameraScale'
import { BREAKING_NEWS } from '../config/breakingnews.config'
import { MagoText } from '../objects/MagoText'
import { MenuContent } from '../objects/MenuContent'

export class Menu extends Phaser.Scene {
	breakingNews: MagoText
	menuContent: MenuContent
	private unsubscribeAppData?: () => void

	constructor() {
		super('Menu')
	}

	create() {
		bindSceneCameraScale(this)

		this.scene.remove('Boot')

		this.cameras.main.filters.internal.clear()

		this.sound.stopByKey('Junkala_Stake_2')
		// this.sound.stopByKey('Junkala_Select_2')

		birbBridge.onceStartGame(() => {
			if (!isActiveDailyPost(birbBridge.getAppData())) return
			this.unsubscribeAppData?.()
			this.scale.off('resize', this.resize, this)
			this.scene.start('Game')
		})

		this.menuContent = new MenuContent(this)

		this.createBreakingNews()

		this.scale.on('resize', this.resize, this)

		this.unsubscribeAppData = birbBridge.onAppData((appData) => this.updateAppData(appData))

		const cached = birbBridge.getAppData()
		if (cached) {
			this.updateAppData(cached)
		}

		this.resize()
	}

	updateAppData(appData: AppData) {
		applyAppDataToRegistry(this.game, appData)
		this.menuContent.updateData(appData)
	}

	getBreakingNewsText(players: DailyLeaderboardEntry[] = []) {
		const topPlayers = players
			.slice(0, 3)
			.map((player) => `"${player.userName}" ${player.score}`)
			.join(',')
		let bannerText = `*LIVE* BREAKING SCORES! ${topPlayers} *LIVE*`
		if (players.length < 1) {
			bannerText = `*LIVE* OHH BOI! STRANGER IS FIRST IN LINE TO BIRB UP! GOOD LUCK! *LIVE*`
		}
		return bannerText
	}

	createBreakingNews() {
		const bannerText = this.getBreakingNewsText(this.registry.get('community:leaderboard') ?? [])

		this.breakingNews = new MagoText(this, layoutWidth(this), 20, bannerText, 100).setOrigin(0, 0)

		this.startBreakingTheNews()
	}

	setRandomBreakingNews() {
		let news = ''
		if (Phaser.Math.Between(0, 9) < 3) {
			news = this.getBreakingNewsText(this.registry.get('community:leaderboard') ?? [])
		} else {
			news = BREAKING_NEWS[Phaser.Math.Between(0, BREAKING_NEWS.length)] ?? ''
		}

		this.breakingNews.setText(news)
	}

	startBreakingTheNews() {
		const speed = 400

		this.setRandomBreakingNews()

		const duration = (this.breakingNews.displayWidth / speed) * 1000

		this.add.tween({
			targets: this.breakingNews,
			x: -this.breakingNews.displayWidth,
			duration: duration,
			repeat: 0,
			onComplete: () => {
				this.breakingNews.x = layoutWidth(this)
				this.startBreakingTheNews()
			},
		})
	}

	resize() {
		this.menuContent.reposition(this)

		if (this.breakingNews) {
			this.breakingNews.setPosition(layoutWidth(this), 20)
		}
	}
}
