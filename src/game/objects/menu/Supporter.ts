import type { AppData, AppIAP } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import globalEventEmitter from '../../web/GlobalEventEmitter'
import { MagoText } from '../MagoText'

export class Supporter extends Phaser.GameObjects.Container {
	info: MagoText

	purchaseActiveText: MagoText
	purchaseButton: Phaser.GameObjects.Image
	purchaseButtonText: MagoText

	iap: AppIAP

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('Supporter')
		this.create(scene.registry.get('community:iap'))

		scene.add.existing(this)
	}

	create(appIap: AppIAP) {
		this.info = new MagoText(this.scene, 0, 100, 'Use Gold to unlock a \nunique Flair to show off!').setOrigin(
			0.5,
			0
		)
		this.purchaseActiveText = new MagoText(this.scene, 0, 300, '')
		this.purchaseButton = this.scene.add
			.image(0, 300, 'UI_Flat_Frame03a')
			.setDisplaySize(719 / 2, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.on('pointerdown', () => {
				this.scene.sound.play('buttonclick1', { volume: 0.5 })
				globalEventEmitter.emit('purchase', { sku: 'supporter-flair-30d' })
			})

		this.purchaseButtonText = new MagoText(this.scene, this.purchaseButton.x, this.purchaseButton.y, 'Purchase', 82)
		this.add([this.info, this.purchaseButton, this.purchaseButtonText, this.purchaseActiveText])

		this.updateText(appIap)
	}

	updateText(stats: AppIAP) {
		if (stats.supporterActiveUntil) {
			this.purchaseButton.setVisible(false)
			this.purchaseButtonText.setVisible(false)

			this.info.setText(`Hooray Active Supporter! Your Flair\n runs out on:`)
			this.purchaseActiveText.setText(`${stats.supporterActiveUntil}.`)
		} else {
			this.purchaseButton.setVisible(true)
			this.purchaseButtonText.setVisible(true)
			this.info.setText('Use Gold to unlock a \nunique Flair to show off!')

			this.purchaseActiveText.setText('')
		}
	}

	updateData(appData: AppData) {
		const iap = appData.community.iap
		this.updateText(iap)
	}
}
