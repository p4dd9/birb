export class Preloader extends Phaser.Scene {
	constructor() {
		super('Preloader')
	}

	preload() {
		// load stuff
	}

	create() {
		this.scene.start('Game')
	}
}
