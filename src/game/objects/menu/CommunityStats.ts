import type { AppCommunityStats, AppData } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import { MagoText } from '../MagoText'

export class CommunityStats extends Phaser.GameObjects.Container {
	score: MagoText
	games: MagoText

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('r/ STATS')
		this.create(scene.registry.get('community:stats'))

		scene.add.existing(this)
	}

	create(stats: Pick<AppCommunityStats, 'communityAttempts' | 'communityScore' | 'topPlayer'>) {
		this.score = new MagoText(this.scene, 0, 100, '').setOrigin(0.5, 0)
		this.games = new MagoText(this.scene, 0, 200, '').setOrigin(0.5, 0)

		this.updateText(stats)

		this.add([this.score, this.games])
	}

	updateText(stats: Pick<AppCommunityStats, 'communityAttempts' | 'communityScore' | 'topPlayer'>) {
		this.updateScore(stats.communityScore)
		this.updateGamesPlayed(stats.communityAttempts)
	}

	updateScore(score: number) {
		this.score.setText(` ${score} points scored. Well done!`)
	}

	updateGamesPlayed(count: number) {
		this.games.setText(`And ${count}x games played!`)
	}

	updateData(appData: AppData) {
		const stats = appData.community.stats
		this.updateText(stats)
	}
}
