import type { LivesData } from '@birb/shared'
import { clientLogger } from '@birb/shared'
import { showForm, showToast } from '@devvit/web/client'
import { shareScoreComment } from '../api/birbClient'
import { birbBridge } from '../api/birbBridge'
import { bindSceneCameraScale, layoutHeight, layoutWidth } from '../cameraScale'
import { applyMuteToGame, loadMutedPref } from '../util/audioPrefs'
import { BIRB_CURSOR } from '../util/dom'
import { LivesHud, readLivesFromRegistry } from '../objects/LivesHud'
import { MagoText } from '../objects/MagoText'
import { MuteToggle } from '../objects/MuteToggle'
import { openLivesPurchaseMenu } from './LivesPurchaseMenu'
import type { Game } from './Game'

const BUTTON_TEXT_PADDING_RATIO = 0.35
const BUTTON_HEIGHT = 100
const BUTTON_STACK_GAP = 24

type GameOverData = {
	isNewHighScore: boolean
	newScore: number
	highscore: number
	attempts: number
	taps: number
	livesBefore: number
	livesAfter: number
	lives: LivesData
}

export class GameOver extends Phaser.Scene {
	replayButton: Phaser.GameObjects.Image
	replayButtonText: MagoText
	shareButton?: Phaser.GameObjects.Image
	shareButtonText?: MagoText
	getLivesButton?: Phaser.GameObjects.Image
	getLivesButtonText?: MagoText

	personalHighscoreText: MagoText
	livesHud?: LivesHud
	muteToggle?: MuteToggle

	private newScore = 0
	private runTaps = 0
	private showShareButton = false
	private outOfLives = false
	private unsubscribeAppData?: () => void

	constructor() {
		super('GameOver')
	}

	create(data: GameOverData) {
		bindSceneCameraScale(this)

		const centerX = layoutWidth(this) / 2
		const centerY = layoutHeight(this) / 2

		const { isNewHighScore, highscore, newScore, taps, livesBefore, livesAfter, lives } = data
		this.newScore = newScore
		this.runTaps = taps
		this.showShareButton = isNewHighScore && newScore > 0
		this.outOfLives = livesAfter <= 0

		if (isNewHighScore) {
			this.sound.play('victory', { volume: 0.2 })
			;(this.scene.get('Game') as Game).fireworks.startLoop()
		}

		applyMuteToGame(this.game, loadMutedPref())

		this.livesHud = new LivesHud(this, { ...lives, count: livesBefore })
		this.livesHud.playLifeLostAnimation(livesBefore, livesAfter)
		this.muteToggle = new MuteToggle(this)

		this.replayButton = this.add
			.image(centerX, centerY, 'UI_Flat_Frame03a')
			.setOrigin(0.5)
			.setInteractive({ cursor: BIRB_CURSOR })
			.once('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.handleRestartPress()
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

		if (this.outOfLives) {
			this.getLivesButton = this.add
				.image(centerX, centerY, 'UI_Flat_Frame03a')
				.setOrigin(0.5)
				.setInteractive({ cursor: BIRB_CURSOR })
				.on('pointerdown', () => {
					this.sound.play('buttonclick1', { volume: 0.5 })
					openLivesPurchaseMenu(this)
				})

			this.getLivesButtonText = new MagoText(this, centerX, centerY, 'Get Lives', 72)
		}

		this.personalHighscoreText = new MagoText(
			this,
			layoutWidth(this) / 2,
			layoutHeight(this) - 15,
			`Highscore: ${highscore}`,
			72
		).setOrigin(0.5, 1)

		this.scale.on('resize', this.resize, this)
		this.unsubscribeAppData = birbBridge.onAppData((appData) => {
			this.registry.set('lives', appData.lives)
			this.livesHud?.setLives(appData.lives)
			if (appData.lives.count > 0 && this.outOfLives) {
				this.outOfLives = false
				this.getLivesButton?.destroy()
				this.getLivesButtonText?.destroy()
				this.getLivesButton = undefined
				this.getLivesButtonText = undefined
				this.resize()
			}
		})
		this.resize()
	}

	handleRestartPress = (): void => {
		const lives = readLivesFromRegistry(this)
		if (lives.count <= 0) {
			openLivesPurchaseMenu(this)
			return
		}

		this.unsubscribeAppData?.()
		this.scale.off('resize', this.resize, this)
		this.scene.start('Game')
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
				taps: this.runTaps,
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
		this.personalHighscoreText.setPosition(layoutWidth(this) / 2, layoutHeight(this) - 15)
		this.livesHud?.layout()
		this.muteToggle?.layout()
	}

	layoutButtons = (centerX: number, centerY: number) => {
		const stackHeights = [BUTTON_HEIGHT]
		if (this.showShareButton) stackHeights.push(BUTTON_HEIGHT)
		if (this.outOfLives && this.getLivesButtonText) stackHeights.push(BUTTON_HEIGHT)

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

		if (this.outOfLives && this.getLivesButton && this.getLivesButtonText) {
			y += BUTTON_STACK_GAP + BUTTON_HEIGHT / 2
			this.layoutButton(this.getLivesButton, this.getLivesButtonText, centerX, y)
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
