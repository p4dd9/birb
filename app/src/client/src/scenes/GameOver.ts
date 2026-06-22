import { clientLogger } from '@birb/shared'
import { showForm, showToast } from '@devvit/web/client'
import { shareScoreComment } from '../api/birbClient'
import { bindSceneCameraScale, layoutHeight, layoutWidth } from '../cameraScale'
import { applyMuteToGame, loadMutedPref, saveMutedPref } from '../util/audioPrefs'
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
	muteButtonText: MagoText

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

		applyMuteToGame(this.game, loadMutedPref())

		this.muteButtonText = new MagoText(this, centerX, centerY, this.getMuteButtonText(), 72)
			.setInteractive({ cursor: BIRB_CURSOR })
			.on('pointerdown', this.toggleMute, this)

		this.personalHighscoreText = new MagoText(
			this,
			layoutWidth(this) / 2,
			layoutHeight(this) - 25,
			`Highscore: ${highscore}`,
			72
		).setOrigin(0.5, 1)

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

	getMuteButtonText = (): string => (this.game.sound.mute ? 'Unmute' : 'Mute')

	toggleMute = (): void => {
		if (this.sound.locked) return

		this.sound.play('buttonclick1', { volume: 0.5 })
		const nextMuted = !this.game.sound.mute
		this.sound.setMute(nextMuted)
		applyMuteToGame(this.game, nextMuted)
		saveMutedPref(nextMuted)
		this.muteButtonText.setText(this.getMuteButtonText())
	}

	resize() {
		const centerX = layoutWidth(this) / 2
		const centerY = layoutHeight(this) / 2

		this.layoutButtons(centerX, centerY)
		this.personalHighscoreText.setPosition(layoutWidth(this) / 2, layoutHeight(this) - 25)
	}

	layoutButtons = (centerX: number, centerY: number) => {
		const stackHeights = [BUTTON_HEIGHT]
		if (this.showShareButton) stackHeights.push(BUTTON_HEIGHT)
		stackHeights.push(this.muteButtonText.displayHeight)

		const totalHeight =
			stackHeights.reduce((sum, height) => sum + height, 0) + (stackHeights.length - 1) * BUTTON_STACK_GAP

		let y = centerY - totalHeight / 2 + stackHeights[0] / 2

		this.layoutButton(this.replayButton, this.replayButtonText, centerX, y)
		y += BUTTON_HEIGHT / 2

		if (this.showShareButton && this.shareButton && this.shareButtonText) {
			y += BUTTON_STACK_GAP + BUTTON_HEIGHT / 2
			this.layoutButton(this.shareButton, this.shareButtonText, centerX, y)
			y += BUTTON_HEIGHT / 2
		}

		y += BUTTON_STACK_GAP + this.muteButtonText.displayHeight / 2
		this.muteButtonText.setPosition(centerX, y)
	}

	layoutButton = (button: Phaser.GameObjects.Image, label: MagoText, x: number, y: number) => {
		const horizontalPadding = label.width * BUTTON_TEXT_PADDING_RATIO
		const buttonWidth = label.width + horizontalPadding * 2

		button.setPosition(x, y)
		button.setDisplaySize(buttonWidth, BUTTON_HEIGHT)
		label.setPosition(x, y)
	}
}
