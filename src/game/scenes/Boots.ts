import globalEventEmitter from '../web/GlobalEventEmitter'

export class Boot extends Phaser.Scene {
	constructor() {
		super('Boot')
	}

	init() {
		globalEventEmitter.emit('requestAppSettings')
		globalEventEmitter.on('changePipeFrame', (pipeFrame: number) => {
			this.game.registry.set('pipeFrame', pipeFrame)
		})
	}

	create() {
		this.scene.start('Preloader')
	}
}
