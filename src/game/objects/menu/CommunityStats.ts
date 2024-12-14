import type { AppCommunityStats, AppData } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import { MagoText } from '../MagoText'

export class CommunityStats extends Phaser.GameObjects.Container {
	score: MagoText
	games: MagoText
	playerCount: MagoText

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('r/ STATS')
		this.create(scene.registry.get('community:stats'))

		scene.add.existing(this)
	}

	create(stats: AppCommunityStats) {
		this.score = new MagoText(this.scene, 0, 100, '').setOrigin(0.5, 0)
		this.games = new MagoText(this.scene, 0, 200, '').setOrigin(0.5, 0)
		this.playerCount = new MagoText(this.scene, 0, 300, '').setOrigin(0.5, 0)

		this.add([this.score, this.games, this.playerCount])

		this.updateText(stats)
	}

	updateText(stats: AppCommunityStats) {
		this.updateScore(stats.communityScore)
		this.updateGamesPlayed(stats.communityAttempts)
		this.updatePlayerCount(stats.communityPlayers)
	}

	updateScore(score: number) {
		this.score.setText(`${score} community points scored!`)
	}

	updateGamesPlayed(count: number) {
		this.games.setText(`${count}x games played!`)
	}

	updatePlayerCount(count: number) {
		this.playerCount.setText(`And ${count} redditors played!`)
	}

	updateData(appData: AppData) {
		const stats = appData.community.stats
		this.updateText(stats)
	}
}
