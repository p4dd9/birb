export class Game extends Phaser.Scene {
	constructor() {
		super('Game')
	}

	preload() {
		// load stuff
	}

	create() {
		this.add.text(200, 200, 'This is Phaser within Reddit!', { color: 'red', fontSize: 72 })
		this.add.text(200, 300, `It's HAMMER TIME!`, { color: 'white', fontSize: 72 })
	}
}
