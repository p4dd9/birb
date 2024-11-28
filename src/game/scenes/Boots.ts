export class Boot extends Phaser.Scene {
	constructor() {
		super('Boot')
	}

	preload() {
		// load stuff
	}

	create() {
		this.scene.start('Preloader')
	}
}
