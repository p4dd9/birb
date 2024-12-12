import { webviewLogger } from '../../../shared/logger'
import type { AppCommunityDaily, AppData } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import { MagoText } from '../MagoText'

export class Daily extends Phaser.GameObjects.Container {
	title: MagoText
	description: MagoText
	reward: MagoText

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('DAILY')
		this.create(scene.registry.get('community:daily'))

		scene.add.existing(this)
	}

	create(daily: AppCommunityDaily) {
		this.title = new MagoText(this.scene, 0, 100, '').setOrigin(0.5, 0)
		this.description = new MagoText(this.scene, 0, 200, '').setOrigin(0.5, 0)
		this.reward = new MagoText(this.scene, 0, 300, '').setOrigin(0.5, 0)

		this.add([this.title, this.description, this.reward])

		this.updateText(daily)
	}

	updateText(daily: AppCommunityDaily) {
		webviewLogger.info(JSON.stringify(daily))

		if (daily.completed) {
			this.updateTitle('Daily Completed! YEY!')
			this.updateDescription(daily.description)
			this.updateReward(daily.reward)
		} else {
			this.updateTitle(daily.title)
			this.updateDescription(daily.description)
			this.updateReward(daily.reward)
		}
	}

	updateTitle(title: string) {
		this.title.setText(title)
	}

	updateDescription(description: string) {
		this.description.setText(description)
	}

	updateReward(reward: string) {
		this.reward.setText(reward)
	}

	updateData(appData: AppData) {
		const data = appData.community.daily
		this.updateText(data)
	}
}
