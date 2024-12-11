import type { WorldSetting } from '../../shared/messages'
import { MagoText } from '../objects/MagoText'
import globalEventEmitter from '../web/GlobalEventEmitter'

export class Boot extends Phaser.Scene {
	constructor() {
		super('Boot')
	}

	preload() {
		this.load.setPath('../assets/')

		this.load.bitmapFont('mago3_black', 'font/mago3_black.png', 'font/mago3_black.xml')
	}

	create() {
		globalEventEmitter.on('changeWorld', this.setWorldSettings, this)
		globalEventEmitter.emit('requestAppSettings')

		new MagoText(this, this.scale.width / 2, this.scale.height / 2, '*BIRD UP*!', 172)

		this.time.delayedCall(400, () => {
			this.scene.run('Preloader')
		})
	}

	setWorldSettings(worldSetting: WorldSetting) {
		this.game.registry.set('pipeFrame', worldSetting.pipeFrame)
		this.game.registry.set('playerFrame', worldSetting.playerFrame)
		this.game.registry.set('background', worldSetting.world)
		globalEventEmitter.off('changeWorld', this.setWorldSettings, this)
	}
}
