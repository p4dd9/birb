import type { AppData } from '@birb/shared'
import { layoutHeight, layoutWidth } from '../cameraScale'
import type { Menu } from '../scenes/Menu'
import { StartContent } from './menu/StartContent'

export class MenuContent extends Phaser.GameObjects.Container {
	startContent: StartContent

	constructor(scene: Menu) {
		super(scene, layoutWidth(scene) / 2, layoutHeight(scene) / 2 - 100)

		this.startContent = new StartContent(scene)
		this.add(this.startContent)
		scene.add.existing(this)
	}

	updateData(appData: AppData) {
		this.startContent.updateData(appData)
	}
}
