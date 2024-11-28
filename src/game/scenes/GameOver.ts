export class GameOver extends Phaser.Scene {
	constructor() {
		super('GameOver')
	}

	preload() {
		// load stuff
	}

	create() {
		this.add.text(this.scale.width / 2, this.scale.height / 2, 'Game Over', { fontSize: '64px' }).setOrigin(0.5)

		this.input.once('pointerdown', () => {
			this.scene.start('Game')
		})
	}
}
