import type { AppData } from '@birb/shared'
import { context } from '@devvit/web/client'
import type { Menu } from '../../scenes/Menu'
import { BIRB_CURSOR } from '../../util/dom'
import { birbBridge } from '../../api/birbBridge'
import { isActiveDailyPost, isDailyPost, navigateToLatestDaily } from '../../api/birbClient'
import { MagoText, MagoTextStyle } from '../MagoText'

const PLAY_BUTTON_GAP = 12
const STACK_GAP = 12

export class StartContent extends Phaser.GameObjects.Container {
	usernameText?: MagoText
	scoreText?: MagoText
	winnerText?: MagoText
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
		this.playButtonText.setInteractive({ cursor: BIRB_CURSOR }).on('pointerdown', () => this.handlePlayPress())

		this.add([this.playButton, this.playButtonText])
	}

	handlePlayPress() {
		this.scene.sound.play('buttonclick1', { volume: 0.5 })

		if (isDailyPost() && !isActiveDailyPost(birbBridge.getAppData())) {
			void navigateToLatestDaily()
			return
		}

		birbBridge.emitStartGame()
	}

	updateData(appData: AppData) {
		if (!isDailyPost()) {
			this.clearDailyHighscore()
			return
		}

		if (!this.usernameText || !this.scoreText || !this.winnerText) {
			this.winnerText = new MagoText(this.scene, 0, 0, 'WINNER', MagoTextStyle.small)
			this.scoreText = new MagoText(this.scene, 0, 0, '', MagoTextStyle.normal * 2)
			this.usernameText = new MagoText(this.scene, 0, 0, '', MagoTextStyle.small)
			this.add([this.winnerText, this.scoreText, this.usernameText])
		}

		if (!isActiveDailyPost(appData)) {
			const leader = appData.leaderboard[0]
			if (leader) {
				this.scoreText.setText(String(leader.score))
				this.usernameText.setText(`u/${leader.userName}`)
				this.winnerText.setVisible(true)
				this.scoreText.setVisible(true)
				this.usernameText.setVisible(true)
				this.layoutDailyHighscore(true)
			} else {
				this.clearDailyHighscore()
			}
			return
		}

		const username = context.username ?? 'player'
		this.scoreText.setText(String(appData.you.highscore))
		this.usernameText.setText(`u/${username}`)
		this.winnerText.setVisible(false)
		this.usernameText.setVisible(true)
		this.scoreText.setVisible(true)
		this.layoutDailyHighscore(false)
	}

	layoutDailyHighscore = (showWinner: boolean) => {
		if (!this.scoreText || !this.usernameText) return

		const playButtonTop = this.playButton.y - this.playButton.displayHeight / 2

		this.usernameText.setY(playButtonTop - PLAY_BUTTON_GAP - this.usernameText.displayHeight / 2)
		this.scoreText.setY(
			this.usernameText.y - this.usernameText.displayHeight / 2 - STACK_GAP - this.scoreText.displayHeight / 2
		)

		if (showWinner && this.winnerText) {
			this.winnerText.setY(
				this.scoreText.y - this.scoreText.displayHeight / 2 - STACK_GAP - this.winnerText.displayHeight / 2
			)
		}
	}

	clearDailyHighscore() {
		this.winnerText?.setVisible(false)
		this.usernameText?.setVisible(false)
		this.scoreText?.setVisible(false)
	}
}
