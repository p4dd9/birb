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

		this.load.audio('bgm_action_5', 'audio/bgm_action_5.mp3')

		this.load.audio('bird_tweety_hurt_01', 'audio/bird_tweety_hurt_01.wav')
		this.load.audio('bird_tweety_hurt_02', 'audio/bird_tweety_hurt_02.wav')
		this.load.audio('bird_tweety_hurt_03', 'audio/bird_tweety_hurt_03.wav')
		this.load.audio('bird_tweety_hurt_04', 'audio/bird_tweety_hurt_04.wav')
		this.load.audio('bird_tweety_hurt_05', 'audio/bird_tweety_hurt_05.wav')
		this.load.audio('bird_tweety_hurt_06', 'audio/bird_tweety_hurt_06.wav')

		this.load.audio('whoosh_swish_small_01', 'audio/whoosh_swish_small_01.wav')
		this.load.audio('whoosh_swish_small_02', 'audio/whoosh_swish_small_02.wav')
		this.load.audio('whoosh_swish_small_03', 'audio/whoosh_swish_small_03.wav')

		this.load.spritesheet('birds', 'birds.png', { frameWidth: 16, frameHeight: 16 })
		this.load.spritesheet('pipes', 'pipes.png', { frameWidth: 32, frameHeight: 80 })
	}

	create() {
		this.sound.add('bgm_action_5')
		this.sound.play('bgm_action_5', { loop: true, volume: 0.3 })
		for (let row = 0; row < 8; row++) {
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
		this.scene.start('Menu')
	}
}
