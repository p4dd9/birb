import type { AppData, AppIAP } from '@birb/shared'
import { OrderResultStatus, purchase, showToast } from '@devvit/web/client'
import type { Menu } from '../../scenes/Menu'
import { refreshAppData } from '../../api/birbClient'
import { MagoText } from '../MagoText'

const MEMBERSHIP_SKU = 'birb-club-member-flair-30d'

export class Membership extends Phaser.GameObjects.Container {
	info: MagoText

	purchaseButton: Phaser.GameObjects.Image
	purchaseButtonText: MagoText

	iap: AppIAP

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('CLUB')
		this.create(scene.registry.get('community:iap'))

		scene.add.existing(this)
	}

	create(appIap: AppIAP) {
		this.info = new MagoText(this.scene, 0, 100, '').setOrigin(0.5, 0)
		this.purchaseButton = this.scene.add
			.image(0, 250, 'UI_Flat_Frame03a')
			.setDisplaySize(420, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.on('pointerdown', () => {
				void this.handlePurchase()
			})

		this.purchaseButtonText = new MagoText(
			this.scene,
			this.purchaseButton.x,
			this.purchaseButton.y,
			'JOIN CLUB',
			82
		)
		this.add([this.info, this.purchaseButton, this.purchaseButtonText])

		this.updateText(appIap)
	}

	handlePurchase = async () => {
		this.scene.sound.play('buttonclick1', { volume: 0.5 })
		this.purchaseButton.disableInteractive()

		try {
			const result = await purchase(MEMBERSHIP_SKU)

			if (result.status === OrderResultStatus.STATUS_CANCELLED) {
				showToast('Purchase canceled.')
				return
			}

			if (result.status !== OrderResultStatus.STATUS_SUCCESS) {
				showToast(result.errorMessage ?? 'Purchase failed. Please try again.')
				return
			}

			showToast('Welcome to the Birb Club!')
			await refreshAppData()
		} catch {
			showToast('Failed to start purchase.')
		} finally {
			this.purchaseButton.setInteractive({ cursor: 'pointer' })
		}
	}

	updateText(stats: AppIAP) {
		if (stats.membershipActiveUntil) {
			this.purchaseButton.setVisible(false)
			this.purchaseButtonText.setVisible(false)

			this.info.setText(`Hooray, You are a Birb Club Member! \nActive until: ${stats.membershipActiveUntil}`)
		} else {
			this.purchaseButton.setVisible(true)
			this.purchaseButtonText.setVisible(true)
			this.info.setText('Birb Club Member Flair \n')
		}
	}

	updateData(appData: AppData) {
		this.updateText(appData.iap)
	}
}
