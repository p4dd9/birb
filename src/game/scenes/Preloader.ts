export class Preloader extends Phaser.Scene {
	constructor() {
		super('Preloader')
	}

	preload() {
		this.load.atlas('bg', '../assets/bg.png', '../assets/bg.json')
		this.load.spritesheet('birds', '../assets/birds.png', { frameWidth: 16, frameHeight: 16 })
	}

	create() {
		this.scene.start('Game')
	}
}
