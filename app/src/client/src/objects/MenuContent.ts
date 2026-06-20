import type { AppData } from '@birb/shared'
import { birbBridge } from '../api/birbBridge'
import { isActiveDailyPost, isDailyPost } from '../api/birbClient'
import { layoutHeight, layoutWidth } from '../cameraScale'
import type { Menu } from '../scenes/Menu'
import { StartContent } from './menu/StartContent'

/** Extra downward shift for archived daily landing (breaking news stays at top). */
const ARCHIVED_DAILY_CONTENT_Y_OFFSET = 50

export class MenuContent extends Phaser.GameObjects.Container {
	startContent: StartContent

	constructor(scene: Menu) {
		super(scene, 0, 0)

		this.startContent = new StartContent(scene)
		this.add(this.startContent)
		scene.add.existing(this)
		this.reposition(scene)
	}

	reposition(scene: Menu) {
		const archivedDaily = isDailyPost() && !isActiveDailyPost(birbBridge.getAppData())
		const centerY = layoutHeight(scene) / 2 + (archivedDaily ? ARCHIVED_DAILY_CONTENT_Y_OFFSET : -100)
		this.setPosition(layoutWidth(scene) / 2, centerY)
	}

	updateData(appData: AppData) {
		this.startContent.updateData(appData)
		this.reposition(this.scene as Menu)
	}
}
