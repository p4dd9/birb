import type { AppData, YouStats as YouStatsData } from '@birb/shared'
import type { Menu } from '../../scenes/Menu'
import { MagoText, MagoTextStyle } from '../MagoText'

type DailyPanel = {
	dateKey: string
	dailyNumber: number
	you: YouStatsData
	leaderName: string | null
	leaderScore: number | null
}

export class Daily extends Phaser.GameObjects.Container {
	title: MagoText
	description: MagoText
	leaderUsername: MagoText
	leaderScore: MagoText

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('DAILY')
		this.create(this.getDailyPanel())

		scene.add.existing(this)
	}

	getDailyPanel(): DailyPanel {
		const leaderboard = this.scene.registry.get('community:leaderboard') as { userName: string; score: number }[] | undefined
		const leader = leaderboard?.[0]

		return {
			dateKey: this.scene.registry.get('daily:dateKey') ?? 'today',
			dailyNumber: this.scene.registry.get('daily:number') ?? 0,
			you: this.scene.registry.get('community:you') ?? {
				highscore: 0,
				attempts: 0,
				taps: 0,
				rank: null,
			},
			leaderName: leader?.userName ?? null,
			leaderScore: leader?.score ?? null,
		}
	}

	create(daily: DailyPanel) {
		this.title = new MagoText(this.scene, 0, 100, '', MagoTextStyle.big).setOrigin(0.5, 0)
		this.description = new MagoText(this.scene, 0, 200, '', MagoTextStyle.normal).setOrigin(0.5, 0)
		this.leaderUsername = new MagoText(this.scene, 0, 280, '', MagoTextStyle.small).setOrigin(0.5, 0)
		this.leaderScore = new MagoText(this.scene, 0, 330, '', MagoTextStyle.normal).setOrigin(0.5, 0)

		this.add([this.title, this.description, this.leaderUsername, this.leaderScore])

		this.updateText(daily)
	}

	updateText(daily: DailyPanel) {
		const n = daily.dailyNumber || 1
		this.title.setText(`#${n} Daily Birb`)
		this.description.setText(`${daily.dateKey} · Same level for everyone`)

		if (daily.leaderName !== null && daily.leaderScore !== null) {
			this.leaderUsername.setText(`u/${daily.leaderName}`)
			this.leaderScore.setText(String(daily.leaderScore))
			this.leaderUsername.setVisible(true)
			this.leaderScore.setVisible(true)
		} else {
			this.leaderUsername.setVisible(false)
			this.leaderScore.setVisible(false)
		}
	}

	updateData(appData: AppData) {
		const leader = appData.leaderboard[0]

		this.updateText({
			dateKey: appData.dateKey,
			dailyNumber: appData.dailyNumber,
			you: appData.you,
			leaderName: leader?.userName ?? null,
			leaderScore: leader?.score ?? null,
		})
	}
}
