import { clientLogger } from '@birb/shared'
import { showForm, showToast } from '@devvit/web/client'
import { shareScoreComment } from '../api/birbClient'
import { bindSceneCameraScale, layoutHeight, layoutWidth } from '../cameraScale'
import { BIRB_CURSOR } from '../util/dom'
import { MagoText } from '../objects/MagoText'

const BUTTON_TEXT_PADDING_RATIO = 0.35
const BUTTON_HEIGHT = 100
const BUTTON_STACK_GAP = 24

export class GameOver extends Phaser.Scene {
	replayButton: Phaser.GameObjects.Image
	replayButtonText: MagoText
	shareButton?: Phaser.GameObjects.Image
	shareButtonText?: MagoText

	personalHighscoreText: MagoText

	private newScore = 0
	private showShareButton = false

	constructor() {
		super('GameOver')
	}

	create(data: { isNewHighScore: boolean; newScore: number; highscore: number; attempts: number }) {
		bindSceneCameraScale(this)

		const centerX = layoutWidth(this) / 2
		const centerY = layoutHeight(this) / 2

		const { isNewHighScore, highscore, newScore } = data
		this.newScore = newScore
		this.showShareButton = isNewHighScore && newScore > 0

		if (isNewHighScore) {
			this.sound.play('victory', { volume: 0.2 })
		}

		this.replayButton = this.add
			.image(centerX, centerY, 'UI_Flat_Frame03a')
			.setOrigin(0.5)
			.setInteractive({ cursor: BIRB_CURSOR })
			.once('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.scale.off('resize', this.resize, this)
				this.scene.start('Game')
			})

		this.replayButtonText = new MagoText(this, centerX, centerY, 'Restart', 72)

		if (this.showShareButton) {
			this.shareButton = this.add
				.image(centerX, centerY, 'UI_Flat_Frame03a')
				.setOrigin(0.5)
				.setInteractive({ cursor: BIRB_CURSOR })
				.on('pointerdown', () => {
					void this.handleSharePress()
				})

			this.shareButtonText = new MagoText(this, centerX, centerY, 'Share', 72)
		}

		this.personalHighscoreText = new MagoText(
			this,
			50,
			layoutHeight(this) - 25,
			`Highscore: ${highscore}`,
			72
		).setOrigin(0, 1)

		this.scale.on('resize', this.resize, this)
		this.resize()
	}

	handleSharePress = async () => {
		this.sound.play('buttonclick1', { volume: 0.5 })

		const result = await showForm({
			title: 'Share Comment',
			description: 'Shares your score and comment in the thread below.',
			fields: [
				{
					type: 'paragraph',
					name: 'comment',
					label: 'Comment',
					required: true,
				},
			],
			acceptLabel: 'Share',
		})

		if (result.action !== 'SUBMITTED') return

		try {
			await shareScoreComment({
				comment: result.values.comment,
				score: this.newScore,
			})
			showToast('Score shared in the thread.')
		} catch (error) {
			clientLogger.error('Failed to share score comment', error)
			showToast('Failed to share score.')
		}
	}

	resize() {
		const centerX = layoutWidth(this) / 2
		const centerY = layoutHeight(this) / 2

		this.layoutButtons(centerX, centerY)
		this.personalHighscoreText.setPosition(50, layoutHeight(this) - 25)
	}

	layoutButtons = (centerX: number, centerY: number) => {
		const stackOffset = this.showShareButton ? (BUTTON_HEIGHT + BUTTON_STACK_GAP) / 2 : 0

		this.layoutButton(this.replayButton, this.replayButtonText, centerX, centerY - stackOffset)

		if (this.showShareButton && this.shareButton && this.shareButtonText) {
			this.layoutButton(this.shareButton, this.shareButtonText, centerX, centerY + stackOffset)
		}
	}

	layoutButton = (button: Phaser.GameObjects.Image, label: MagoText, x: number, y: number) => {
		const horizontalPadding = label.width * BUTTON_TEXT_PADDING_RATIO
		const buttonWidth = label.width + horizontalPadding * 2

		button.setPosition(x, y)
		button.setDisplaySize(buttonWidth, BUTTON_HEIGHT)
		label.setPosition(x, y)
	}
}
