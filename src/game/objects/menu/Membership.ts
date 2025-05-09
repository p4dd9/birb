import type { AppData, AppIAP } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import globalEventEmitter from '../../web/GlobalEventEmitter'
import { MagoText } from '../MagoText'

export class Membership extends Phaser.GameObjects.Container {
	info: MagoText

	purchaseButton: Phaser.GameObjects.Image
	purchaseButtonText: MagoText

	iap: AppIAP

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('r/ CLUB')
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
				this.scene.sound.play('buttonclick1', { volume: 0.5 })
				globalEventEmitter.emit('purchase', { sku: 'birb-club-member-flair-30d' })
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
		const iap = appData.community.iap
		this.updateText(iap)
	}
}
