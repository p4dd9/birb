import type { WorldSetting } from '../../shared/messages'
import { addDebugMsg } from '../debug'
import globalEventEmitter from '../web/GlobalEventEmitter'

export class Boot extends Phaser.Scene {
	constructor() {
		super('Boot')
	}

	create() {
		globalEventEmitter.once('changeWorld', (worldSetting: WorldSetting) => {
			addDebugMsg('Changed pipeframe to ' + JSON.stringify(worldSetting))
			this.game.registry.set('pipeFrame', worldSetting.pipeFrame)
			this.game.registry.set('playerFrame', worldSetting.playerFrame)
		})

		this.scene.start('Preloader')
	}
}
