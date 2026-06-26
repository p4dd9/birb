import type { LivesData } from '@birb/shared'
import { clientLogger, LIVES_SHARE_REWARD } from '@birb/shared'
import { showForm, showToast } from '@devvit/web/client'
import { birbBridge } from '../api/birbBridge'
import { getDailyNumber, refreshAppData, shareScoreComment } from '../api/birbClient'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { HUD_EDGE, HUD_ROW_CENTER_Y, HUD_SOUND_DISPLAY_W } from '../config/hudLayout'
import { LivesHud, readLivesFromRegistry } from '../objects/LivesHud'
import { MagoText, MagoTextStyle } from '../objects/MagoText'
import { MuteToggle } from '../objects/MuteToggle'
import { applyMuteToGame, loadMutedPref } from '../util/audioPrefs'
import { BIRB_CURSOR } from '../util/dom'
import type { Game } from './Game'
import { openJoinRewardMenu } from './JoinRewardMenu'
import { openLivesPurchaseMenu } from './LivesPurchaseMenu'
import { openSettingsMenu } from './SettingsMenu'

const BUTTON_TEXT_PADDING_RATIO = 0.35
const BUTTON_HEIGHT = 100
const BUTTON_STACK_GAP = 24

/** Settings gear sits in the top-right HUD cluster, just left of the mute toggle. */
const SETTINGS_BUTTON_SIZE = 48
const SETTINGS_BUTTON_GAP = 12
/** Delay before the join-reward popup so it doesn't collide with the death/score animation. */
const JOIN_REWARD_POPUP_DELAY_MS = 700

/** "+N <heart>" reward badge sitting beside the Share label, smaller than it. */
const SHARE_BADGE_HEART_SCALE = 2
const SHARE_BADGE_GAP = 18
const SHARE_BADGE_ICON_GAP = 6

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
	shareBadge?: Phaser.GameObjects.Container
	shareBadgeText?: MagoText
	shareBadgeHeart?: Phaser.GameObjects.Sprite
	getLivesButton?: Phaser.GameObjects.Image
	getLivesButtonText?: MagoText

	personalHighscoreText: MagoText
	livesHud?: LivesHud
	muteToggle?: MuteToggle
	private settingsButton?: Phaser.GameObjects.Image
	private settingsIcon?: Phaser.GameObjects.Text

	private newScore = 0
	private runTaps = 0
	private showShareButton = false
	private shareRewardClaimed = false
	private outOfLives = false
	private unsubscribeAppData?: () => void

	constructor() {
		super('GameOver')
	}

	create(data: GameOverData) {
		const centerX = layoutWidth(this) / 2
		const centerY = layoutHeight(this) / 2

		const { isNewHighScore, highscore, newScore, taps, livesBefore, livesAfter, lives } = data
		this.newScore = newScore
		this.runTaps = taps
		this.showShareButton = isNewHighScore && newScore > 0
		this.shareRewardClaimed = birbBridge.getAppData()?.shareRewardClaimed ?? false
		this.outOfLives = livesAfter <= 0

		if (isNewHighScore) {
			this.sound.play('victory', { volume: 0.2 })
			;(this.scene.get('Game') as Game).fireworks.startLoop()
		}

		applyMuteToGame(this.game, loadMutedPref())

		this.livesHud = new LivesHud(this, { ...lives, count: livesBefore })
		this.livesHud.playLifeLostAnimation(livesBefore, livesAfter)
		this.muteToggle = new MuteToggle(this)
		this.createSettingsButton()

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

			// Smaller "+N ❤" reward hint next to the Share label — only while the
			// one-time bonus is still claimable for this daily.
			if (!this.shareRewardClaimed) {
				this.shareBadgeText = new MagoText(this, 0, 0, `+${LIVES_SHARE_REWARD}`, MagoTextStyle.small)
				this.shareBadgeHeart = this.add.sprite(0, 0, 'hearts', 'hearts 0.png').setScale(SHARE_BADGE_HEART_SCALE)
				this.shareBadge = this.add.container(0, 0, [this.shareBadgeText, this.shareBadgeHeart])
			}
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
			if (appData.lives.count > 0) this.clearOutOfLivesUi()
		})
		this.resize()
		this.maybeShowJoinReward()
	}

	/** Top-right gear button that opens the settings modal; always visible. */
	private createSettingsButton = (): void => {
		this.settingsButton = this.add
			.image(0, 0, 'UI_Flat_FrameSlot03b')
			.setOrigin(0.5)
			.setDisplaySize(SETTINGS_BUTTON_SIZE, SETTINGS_BUTTON_SIZE)
			.setScrollFactor(0)
			.setDepth(200)
			.setInteractive({ cursor: BIRB_CURSOR })
			.on('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				openSettingsMenu(this)
			})

		this.settingsIcon = this.add
			.text(0, 0, '⚙', { fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#ffffff' })
			.setOrigin(0.5)
			.setScrollFactor(0)
			.setDepth(201)
	}

	private layoutSettingsButton = (): void => {
		if (!this.settingsButton || !this.settingsIcon) return
		// Sit just left of the mute toggle (which is anchored to the top-right edge).
		const x = layoutWidth(this) - HUD_EDGE - HUD_SOUND_DISPLAY_W - SETTINGS_BUTTON_GAP - SETTINGS_BUTTON_SIZE / 2
		const y = HUD_ROW_CENTER_Y
		this.settingsButton.setPosition(x, y)
		this.settingsIcon.setPosition(x, y)
	}

	/** Show the one-time join-and-subscribe reward popup if the player has crossed an unclaimed tier. */
	private maybeShowJoinReward = (): void => {
		void (async () => {
			// Refresh so the just-incremented attempt count is reflected without waiting for the poll.
			await refreshAppData()
			if (!this.scene.isActive('GameOver')) return

			const joinReward = birbBridge.getAppData()?.joinReward
			if (!joinReward || joinReward.claimed || joinReward.promptTier == null) return

			const tier = joinReward.promptTier
			this.time.delayedCall(JOIN_REWARD_POPUP_DELAY_MS, () => {
				if (this.scene.isActive('GameOver')) openJoinRewardMenu(this, tier)
			})
		})()
	}

	/** Mark the one-time share bonus as claimed for this daily, locally and on the cached app data. */
	private markShareRewardClaimed = (): void => {
		this.shareRewardClaimed = true
		const appData = birbBridge.getAppData()
		if (appData && !appData.shareRewardClaimed) {
			birbBridge.setAppData({ ...appData, shareRewardClaimed: true })
		}
	}

	/** Remove the Share button and its reward badge once the score has been shared. */
	private clearShareUi = (): void => {
		if (!this.showShareButton) return
		this.showShareButton = false
		this.shareButton?.destroy()
		this.shareButtonText?.destroy()
		this.shareBadge?.destroy()
		this.shareButton = undefined
		this.shareButtonText = undefined
		this.shareBadge = undefined
		this.shareBadgeText = undefined
		this.shareBadgeHeart = undefined
		this.resize()
	}

	/** Drop the "Get Lives" button once the player has lives again. */
	private clearOutOfLivesUi = (): void => {
		if (!this.outOfLives) return
		this.outOfLives = false
		this.getLivesButton?.destroy()
		this.getLivesButtonText?.destroy()
		this.getLivesButton = undefined
		this.getLivesButtonText = undefined
		this.resize()
	}

	handleRestartPress = (): void => {
		const lives = readLivesFromRegistry(this)
		if (lives.count <= 0) {
			openLivesPurchaseMenu(this)
			return
		}

		;(this.scene.get('Game') as Game).fireworks.stop()
		this.unsubscribeAppData?.()
		this.scale.off('resize', this.resize, this)
		this.scene.stop('GameOver')
		this.scene.start('Game')
	}

	handleSharePress = async () => {
		this.sound.play('buttonclick1', { volume: 0.5 })

		const dailyNumber = getDailyNumber()
		if (dailyNumber === undefined) {
			clientLogger.error('Cannot share score: missing dailyNumber')
			showToast('Failed to share score.')
			return
		}

		const rewardHint = this.shareRewardClaimed
			? ''
			: `\n\n❤️ Share your highscore to earn +${LIVES_SHARE_REWARD} lives!`

		const result = await showForm({
			title: 'Share Comment',
			description: `Shares your score and comment in the thread below.${rewardHint}`,
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
			const { lives, rewarded } = await shareScoreComment({
				comment: result.values.comment,
				score: this.newScore,
				taps: this.runTaps,
				dailyNumber,
			})
			this.registry.set('lives', lives)
			this.livesHud?.setLives(lives)
			if (lives.count > 0) this.clearOutOfLivesUi()
			this.markShareRewardClaimed()
			this.clearShareUi()
			showToast(rewarded ? `Score shared! +${LIVES_SHARE_REWARD} lives added.` : 'Score shared in the thread.')
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
		this.layoutSettingsButton()
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
			if (this.shareBadge) this.layoutShareButton(centerX, y)
			else this.layoutButton(this.shareButton, this.shareButtonText, centerX, y)
			y += BUTTON_HEIGHT / 2
		}

		if (this.outOfLives && this.getLivesButton && this.getLivesButtonText) {
			y += BUTTON_STACK_GAP + BUTTON_HEIGHT / 2
			this.layoutButton(this.getLivesButton, this.getLivesButtonText, centerX, y)
		}
	}

	/** Share button: "Share" label plus a smaller "+N <heart>" reward badge, both centered in the frame. */
	layoutShareButton = (x: number, y: number) => {
		if (
			!this.shareButton ||
			!this.shareButtonText ||
			!this.shareBadge ||
			!this.shareBadgeText ||
			!this.shareBadgeHeart
		)
			return

		// Lay out the badge content ("+N" then heart) left-aligned within its container.
		const heartWidth = this.shareBadgeHeart.displayWidth
		const badgeWidth = this.shareBadgeText.width + SHARE_BADGE_ICON_GAP + heartWidth
		this.shareBadgeText.setOrigin(0, 0.5).setPosition(-badgeWidth / 2, 0)
		this.shareBadgeHeart
			.setOrigin(0, 0.5)
			.setPosition(-badgeWidth / 2 + this.shareBadgeText.width + SHARE_BADGE_ICON_GAP, 0)

		const labelWidth = this.shareButtonText.width
		const contentWidth = labelWidth + SHARE_BADGE_GAP + badgeWidth
		const horizontalPadding = labelWidth * BUTTON_TEXT_PADDING_RATIO
		const buttonWidth = contentWidth + horizontalPadding * 2

		this.shareButton.setPosition(x, y)
		this.shareButton.setDisplaySize(buttonWidth, BUTTON_HEIGHT)

		const leftEdge = x - contentWidth / 2
		this.shareButtonText.setOrigin(0.5, 0.5).setPosition(leftEdge + labelWidth / 2, y)
		this.shareBadge.setPosition(leftEdge + labelWidth + SHARE_BADGE_GAP + badgeWidth / 2, y)
	}

	layoutButton = (button: Phaser.GameObjects.Image, label: MagoText, x: number, y: number) => {
		const horizontalPadding = label.width * BUTTON_TEXT_PADDING_RATIO
		const buttonWidth = label.width + horizontalPadding * 2

		button.setPosition(x, y)
		button.setDisplaySize(buttonWidth, BUTTON_HEIGHT)
		label.setPosition(x, y)
	}
}
