import { LIVES_PRODUCT_OFFERS, clientLogger } from '@birb/shared'
import { OrderResultStatus, purchase, showToast } from '@devvit/web/client'
import { refreshAppData } from '../api/birbClient'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { MagoText, MagoTextStyle } from '../objects/MagoText'
import { BIRB_CURSOR } from '../util/dom'

const PANEL_OUTER_INSET = 24
const PANEL_INNER_PAD = 32
const BUTTON_HEIGHT = 88
const BUTTON_GAP = 16
const BUTTON_TEXT_PADDING_RATIO = 0.5
const BUTTON_TEXT_EXTRA_PAD = 20
const PORTRAIT_SIZE = 120
const PORTRAIT_TOP_OFFSET = 90
const TITLE_TOP_OFFSET = 165
const TITLE_TO_BUTTONS_GAP = 72
const CLOSE_BUTTON_HEIGHT = 36
const CLOSE_BUTTON_TEXT_PADDING_RATIO = 0.5
const CLOSE_BUTTON_TEXT_EXTRA_PAD = 20
const CLOSE_BOTTOM_INSET = 28

export class LivesPurchaseMenu extends Phaser.Scene {
	private loadingSku: string | null = null

	constructor() {
		super('LivesPurchaseMenu')
	}

	create() {
		const width = layoutWidth(this)
		const height = layoutHeight(this)
		const centerX = width / 2
		const centerY = height / 2

		this.add
			.rectangle(centerX, centerY, width, height, 0x000000, 0.72)
			.setInteractive()
			.setDepth(500)

		const panelWidth = Math.min(420, width - PANEL_OUTER_INSET * 2)
		const panelHeight = Math.min(620, height - PANEL_OUTER_INSET * 2)
		const panelTop = centerY - panelHeight / 2

		this.add
			.image(centerX, panelTop + PORTRAIT_TOP_OFFSET, 'hearts_portrait')
			.setDisplaySize(PORTRAIT_SIZE, PORTRAIT_SIZE)
			.setDepth(502)

		new MagoText(this, centerX, panelTop + TITLE_TOP_OFFSET, 'Get Lives', 72).setOrigin(0.5).setDepth(502)

		let y = panelTop + TITLE_TOP_OFFSET + TITLE_TO_BUTTONS_GAP
		for (const offer of LIVES_PRODUCT_OFFERS) {
			const label = new MagoText(this, centerX, y, `${offer.label} — ${offer.price} gold`, MagoTextStyle.small)
				.setOrigin(0.5)
				.setDepth(503)

			const button = this.add
				.image(centerX, y, 'UI_Flat_Frame03a')
				.setOrigin(0.5)
				.setInteractive({ cursor: BIRB_CURSOR })
				.setDepth(502)
				.on('pointerdown', () => {
					void this.handlePurchase(offer.sku, offer.lives, offer.label)
				})

			this.layoutOfferButton(button, label, centerX, y, panelWidth)
			y += BUTTON_HEIGHT + BUTTON_GAP
		}

		const closeY = centerY + panelHeight / 2 - CLOSE_BOTTOM_INSET
		const closeLabel = new MagoText(this, centerX, closeY, 'Close', MagoTextStyle.small).setOrigin(0.5).setDepth(503)
		const closeButton = this.add
			.image(centerX, closeY, 'UI_Flat_Frame03a')
			.setOrigin(0.5)
			.setInteractive({ cursor: BIRB_CURSOR })
			.setDepth(502)
			.on('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.close()
			})

		this.layoutCloseButton(closeButton, closeLabel, centerX, closeY)

		this.scale.on('resize', this.resize, this)
	}

	layoutOfferButton = (
		button: Phaser.GameObjects.Image,
		label: MagoText,
		x: number,
		y: number,
		panelWidth: number
	): void => {
		const horizontalPadding = label.width * BUTTON_TEXT_PADDING_RATIO + BUTTON_TEXT_EXTRA_PAD
		const buttonWidth = Math.min(label.width + horizontalPadding * 2, panelWidth - PANEL_INNER_PAD)

		button.setPosition(x, y)
		button.setDisplaySize(buttonWidth, BUTTON_HEIGHT)
		label.setPosition(x, y)
	}

	layoutCloseButton = (
		button: Phaser.GameObjects.Image,
		label: MagoText,
		x: number,
		y: number
	): void => {
		const horizontalPadding = label.width * CLOSE_BUTTON_TEXT_PADDING_RATIO + CLOSE_BUTTON_TEXT_EXTRA_PAD
		const buttonWidth = label.width + horizontalPadding * 2

		button.setPosition(x, y)
		button.setDisplaySize(buttonWidth, CLOSE_BUTTON_HEIGHT)
		label.setPosition(x, y)
	}

	close = (): void => {
		this.scale.off('resize', this.resize, this)
		this.scene.stop('LivesPurchaseMenu')
	}

	private handlePurchase = async (sku: string, lives: number, label: string): Promise<void> => {
		if (this.loadingSku) return
		this.loadingSku = sku
		this.sound.play('buttonclick1', { volume: 0.5 })

		try {
			const result = await purchase(sku)
			if (result.status === OrderResultStatus.STATUS_CANCELLED) {
				return
			}
			if (result.status !== OrderResultStatus.STATUS_SUCCESS) {
				showToast(result.errorMessage || 'Purchase failed.')
				return
			}

			showToast(`${label} added!`)
			await refreshAppData()
			this.close()
		} catch (error) {
			clientLogger.error('Lives purchase failed', error)
			showToast('Purchase failed.')
		} finally {
			this.loadingSku = null
		}
	}

	resize = (): void => {
		this.scene.restart()
	}
}

export const openLivesPurchaseMenu = (scene: Phaser.Scene): void => {
	if (scene.scene.isActive('LivesPurchaseMenu')) return
	scene.scene.launch('LivesPurchaseMenu')
	scene.scene.bringToTop('LivesPurchaseMenu')
}
