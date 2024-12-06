import type { WorldSetting } from '../../shared/messages'
import globalEventEmitter from '../web/GlobalEventEmitter'

export class Boot extends Phaser.Scene {
	constructor() {
		super('Boot')
	}

	create() {
		globalEventEmitter.on('changeWorld', (worldSetting: WorldSetting) => {
			this.game.registry.set('pipeFrame', worldSetting.pipeFrame)
			this.game.registry.set('playerFrame', worldSetting.playerFrame)
		})
		this.scene.start('Preloader')
	}
}
