import type { AppData } from '@birb/shared'
import { birbBridge } from '../api/birbBridge'
import { applyAppDataToRegistry, applyPostDataToRegistry } from '../api/birbClient'
import { bindSceneCameraScale, layoutHeight, layoutWidth } from '../cameraScale'
import { MagoText } from '../objects/MagoText'
import { changeBackgroundStyle } from '../util/dom'

export class Boot extends Phaser.Scene {
	constructor() {
		super('Boot')
	}

	preload() {
		this.load.setPath('../assets/')

		this.load.bitmapFont('mago3_black', 'font/mago3_black.png', 'font/mago3_black.xml')
	}

	create() {
		bindSceneCameraScale(this)
		applyPostDataToRegistry(this.game)

		const cached = birbBridge.getAppData()
		if (cached) {
			this.setAppData(cached)
			return
		}

		const unsubscribe = birbBridge.onAppData((appData) => {
			unsubscribe()
			this.setAppData(appData)
		})
	}

	setAppData(appData: AppData) {
		applyAppDataToRegistry(this.game, appData)

		changeBackgroundStyle(this.game.registry.get('background'))

		new MagoText(this, layoutWidth(this) / 2, layoutHeight(this) / 2, '*BIRB UP*', 172)

		this.scene.start('Preloader')
	}
}
