import { clientLogger, JOIN_REWARD_LIVES } from '@birb/shared'
import { showToast } from '@devvit/web/client'
import { birbBridge } from '../api/birbBridge'
import { claimJoinReward, markJoinRewardSeen } from '../api/birbClient'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { createNinePanel, PANEL_FRAME_BLUE } from '../objects/NinePanel'
import { MagoText, MagoTextStyle } from '../objects/MagoText'
import { BIRB_CURSOR } from '../util/dom'

const PANEL_OUTER_INSET = 24
const PANEL_HEIGHT_MAX = 580
const PORTRAIT_SIZE = 96
const PORTRAIT_TOP_OFFSET = 56
const CONTENT_GAP = 14
const BODY_TO_BUTTON_GAP = 32
const TITLE_FONT_MIN = MagoTextStyle.small
const TITLE_FONT_MAX = MagoTextStyle.normal
const BUTTON_HEIGHT = 72
const BUTTON_BOTTOM_INSET = 44

type JoinRewardData = { tier: number }

export class JoinRewardMenu extends Phaser.Scene {
	private busy = false

	constructor() {
		super('JoinRewardMenu')
	}

	create(data: JoinRewardData) {
		const width = layoutWidth(this)
		const height = layoutHeight(this)
		const centerX = width / 2
		const centerY = height / 2

		// Mark as shown so it won't re-appear at this tier even if dismissed.
		if (data?.tier) {
			void markJoinRewardSeen(data.tier).catch((error) =>
				clientLogger.error('Failed to mark join reward seen', error)
			)
		}

		this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.72).setInteractive().setDepth(500)

		const panelWidth = Math.min(420, width - PANEL_OUTER_INSET * 2)
		const panelHeight = Math.min(PANEL_HEIGHT_MAX, height - PANEL_OUTER_INSET * 2)
		const panelTop = centerY - panelHeight / 2
		const panelBottom = centerY + panelHeight / 2

		createNinePanel(this, centerX, centerY, panelWidth, panelHeight, PANEL_FRAME_BLUE)

		this.add
			.image(centerX, panelTop + PORTRAIT_TOP_OFFSET, 'hearts_portrait')
			.setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE)
			.setDepth(502)

		const titleFontSize = Math.round(
			Math.min(TITLE_FONT_MAX, Math.max(TITLE_FONT_MIN, panelWidth * 0.14))
		)

		let contentY = panelTop + PORTRAIT_TOP_OFFSET + PORTRAIT_SIZE / 2 + CONTENT_GAP

		const title = new MagoText(
			this,
			centerX,
			contentY,
			`Join Birb\n+${JOIN_REWARD_LIVES} lives`,
			titleFontSize
		)
			.setOrigin(0.5, 0)
			.setDepth(502)
		title.setCenterAlign()
		contentY += title.height + CONTENT_GAP

		const body = new MagoText(
			this,
			centerX,
			contentY,
			'Subscribe and turn on\nnotifications to claim.',
			MagoTextStyle.small
		)
			.setOrigin(0.5, 0)
			.setDepth(502)
		body.setCenterAlign()
		contentY += body.height + BODY_TO_BUTTON_GAP

		const buttonY = Math.max(
			contentY + BUTTON_HEIGHT / 2,
			panelBottom - BUTTON_BOTTOM_INSET - BUTTON_HEIGHT / 2
		)

		this.addButton(centerX, buttonY, 'Join & Claim', () => void this.onAccept())

		this.scale.on('resize', this.resize, this)
	}

	private addButton = (x: number, y: number, label: string, onClick: () => void): void => {
		const text = new MagoText(this, x, y, label, MagoTextStyle.small).setOrigin(0.5).setDepth(503)
		this.add
			.image(x, y, 'UI_Flat_Frame03a')
			.setOrigin(0.5)
			.setDisplaySize(text.width + 80, BUTTON_HEIGHT)
			.setInteractive({ cursor: BIRB_CURSOR })
			.setDepth(502)
			.on('pointerdown', onClick)
	}

	private onAccept = async (): Promise<void> => {
		if (this.busy) return
		this.busy = true
		this.sound.play('buttonclick1', { volume: 0.5 })

		try {
			const result = await claimJoinReward()
			this.registry.set('lives', result.lives)
			showToast(
				result.alreadyClaimed ? 'Welcome back to the flock!' : `Welcome to the flock! +${result.granted} lives`
			)
		} catch (error) {
			clientLogger.error('Failed to claim join reward', error)
			showToast('Could not complete — try again later.')
		} finally {
			this.busy = false
			this.close()
		}
	}

	close = (): void => {
		this.scale.off('resize', this.resize, this)
		this.scene.stop('JoinRewardMenu')
	}

	resize = (): void => {
		this.scene.restart({ tier: 0 })
	}
}

export const openJoinRewardMenu = (scene: Phaser.Scene, tier: number): void => {
	if (scene.scene.isActive('JoinRewardMenu')) return
	scene.scene.launch('JoinRewardMenu', { tier })
	scene.scene.bringToTop('JoinRewardMenu')
}
