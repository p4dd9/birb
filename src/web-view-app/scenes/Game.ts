export class Game extends Phaser.Scene {
	constructor() {
		super('Game')
	}

	preload() {
		// load stuff
	}

	create() {
		this.add.text(200, 200, 'Moin!', { color: 'red', fontSize: 72 })
	}
}
