import type { AppData } from '../../shared/messages'
import { MagoText } from '../objects/MagoText'
import { changeBackgroundStyle } from '../util/dom'
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
		globalEventEmitter.on('updateAppData', this.setAppData, this)
		globalEventEmitter.emit('requestAppData')
	}

	setAppData(appData: AppData) {
		this.game.registry.set('pipeFrame', appData.config.pipeFrame)
		this.game.registry.set('playerFrame', appData.config.playerFrame)
		this.game.registry.set('background', appData.config.world)

		this.game.registry.set('community:leaderboard', appData.community.leaderboard)
		this.game.registry.set('community:online', appData.community.online)
		this.game.registry.set('community:stats', appData.community.stats)
		this.game.registry.set('community:you', appData.community.you)
		this.game.registry.set('community:daily', appData.community.daily)

		changeBackgroundStyle(appData.config.world)

		new MagoText(this, this.scale.width / 2, this.scale.height / 2, '*BIRD UP*', 172)

		this.time.delayedCall(400, () => {
			this.scene.run('Preloader')
		})

		globalEventEmitter.off('updateAppData', this.setAppData, this)
	}
}
