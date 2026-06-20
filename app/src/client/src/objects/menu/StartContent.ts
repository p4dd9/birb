import type { AppData } from '@birb/shared'
import { context, navigateTo } from '@devvit/web/client'
import type { Menu } from '../../scenes/Menu'
import { BIRB_CURSOR } from '../../util/dom'
import { birbBridge } from '../../api/birbBridge'
import { isActiveDailyPost, isDailyPost } from '../../api/birbClient'
import { MagoText, MagoTextStyle } from '../MagoText'

export class StartContent extends Phaser.GameObjects.Container {
	usernameText?: MagoText
	scoreText?: MagoText
	playButton: Phaser.GameObjects.Image
	playButtonText: MagoText

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('BIRB')
		this.create()

		scene.add.existing(this)
	}

	create() {
		this.playButton = this.scene.add
			.image(0, 170, 'UI_Flat_Frame03a')
			.setDisplaySize(719 / 2, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: BIRB_CURSOR })
			.on('pointerdown', () => this.handlePlayPress())

		this.playButtonText = new MagoText(this.scene, this.playButton.x, this.playButton.y, 'Play', MagoTextStyle.bigger)

		this.add([this.playButton, this.playButtonText])
	}

	handlePlayPress() {
		this.scene.sound.play('buttonclick1', { volume: 0.5 })

		const appData = birbBridge.getAppData()
		if (isDailyPost() && !isActiveDailyPost(appData)) {
			const url = appData?.latestDailyPostUrl
			if (url) navigateTo(url)
			return
		}

		birbBridge.emitStartGame()
	}

	updateData(appData: AppData) {
		if (!isDailyPost()) {
			this.clearDailyHighscore()
			return
		}

		if (!this.usernameText || !this.scoreText) {
			this.usernameText = new MagoText(this.scene, 0, 90, '', MagoTextStyle.small)
			this.scoreText = new MagoText(this.scene, 0, 140, '', MagoTextStyle.normal)
			this.add([this.usernameText, this.scoreText])
		}

		if (!isActiveDailyPost(appData)) {
			const leader = appData.leaderboard[0]
			if (leader) {
				this.usernameText.setText(`u/${leader.userName}`)
				this.scoreText.setText(String(leader.score))
				this.usernameText.setVisible(true)
				this.scoreText.setVisible(true)
			} else {
				this.clearDailyHighscore()
			}
			return
		}

		const username = context.username ?? 'player'
		this.usernameText.setText(`u/${username}`)
		this.scoreText.setText(String(appData.you.highscore))
		this.usernameText.setVisible(true)
		this.scoreText.setVisible(true)
	}

	clearDailyHighscore() {
		this.usernameText?.setVisible(false)
		this.scoreText?.setVisible(false)
	}
}
