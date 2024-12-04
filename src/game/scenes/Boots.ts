import globalEventEmitter from '../web/GlobalEventEmitter'

export class Boot extends Phaser.Scene {
	constructor() {
		super('Boot')
	}

	init() {
		globalEventEmitter.emit('requestBackgroundChange')
	}

	create() {
		this.scene.start('Preloader')
	}
}
