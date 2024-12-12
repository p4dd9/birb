import type { AppCommunityYouStats, AppData } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import { getRank, type RankInfo } from '../../util/rank'
import { MagoText } from '../MagoText'

export class YouStats extends Phaser.GameObjects.Container {
	rank: MagoText
	nextRank: MagoText
	highscore: MagoText

	rankInfo: RankInfo

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('YOU')
		this.create(scene.registry.get('community:you'))

		scene.add.existing(this)
	}

	create(stats: AppCommunityYouStats) {
		this.rank = new MagoText(this.scene, 0, 100, '').setOrigin(0.5, 0)
		this.nextRank = new MagoText(this.scene, 0, 200, '').setOrigin(0.5, 0)
		this.highscore = new MagoText(this.scene, 0, 300, '').setOrigin(0.5, 0)

		this.updateText(stats)

		this.add([this.highscore, this.rank, this.nextRank])
	}

	updateText(stats: AppCommunityYouStats) {
		this.rankInfo = getRank(stats.attempts)

		this.updateScore(stats.highscore)

		this.updateRank(stats.attempts)
		this.updateNextRank()
	}

	updateScore(score: number) {
		this.highscore.setText(`Your highscore is ${score}!`)
	}

	updateRank(attempts: number) {
		this.rank.setText(`'${this.rankInfo.currentRank}' (${attempts}x played)`)
	}

	updateNextRank() {
		if (this.rankInfo.gamesToNextRank && this.rankInfo.nextRank) {
			this.nextRank.setText(`${this.rankInfo.gamesToNextRank}x more to '${this.rankInfo.nextRank}'`)
		} else {
			this.nextRank.setText(`You've achieved the highest rank!`)
		}
	}

	updateData(appData: AppData) {
		const stats = appData.community.you
		this.updateText(stats)
	}
}
