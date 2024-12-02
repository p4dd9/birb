export class Preloader extends Phaser.Scene {
	constructor() {
		super('Preloader')
	}

	preload() {
		this.load.setPath('../assets/')

		this.load.font('mago3', 'font/mago3.ttf', 'truetype')

		this.load.image('UI_Flat_FrameSlot03b', 'gui/UI_Flat_FrameSlot03b.png')
		this.load.image('UI_Flat_Frame03a', 'gui/UI_Flat_Frame03a.png')

		this.load.image('Icon_Cursor_02a', 'objects/Icon_Cursor_02a.png')

		this.load.spritesheet('birds', 'birds.png', { frameWidth: 16, frameHeight: 16 })
		this.load.spritesheet('pipes', 'pipes.png', { frameWidth: 32, frameHeight: 80 })
	}

	create() {
		for (let row = 0; row < 7; row++) {
			this.anims.create({
				key: `flap_${row}`,
				frames: this.anims.generateFrameNumbers('birds', {
					start: row * 4,
					end: row * 4 + 3,
				}),
				frameRate: 12,
				repeat: 0,
			})
		}
		this.scene.start('Game')
	}
}
