import type { AppData } from '../../../shared/messages'
import type { Menu } from '../../scenes/Menu'
import globalEventEmitter from '../../web/GlobalEventEmitter'
import { MagoText } from '../MagoText'

export class StartContent extends Phaser.GameObjects.Container {
	playButton: Phaser.GameObjects.Image
	playButtonText: MagoText

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.setName('REDDIBIRDS')
		this.create()

		scene.add.existing(this)
	}

	create() {
		this.playButton = this.scene.add
			.image(0, 170, 'UI_Flat_Frame03a')
			.setDisplaySize(719 / 2, 100)
			.setOrigin(0.5)
			.setInteractive({ cursor: 'pointer' })
			.once('pointerdown', () => {
				globalEventEmitter.emit('startGame')
			})

		this.playButtonText = new MagoText(this.scene, this.playButton.x, this.playButton.y, 'Play', 82)

		this.add([this.playButton, this.playButtonText])
	}

	updateData(_appData: AppData) {
		// silence is key
	}
}
