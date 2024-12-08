import globalEventEmitter from '../web/GlobalEventEmitter'

export class Preloader extends Phaser.Scene {
	constructor() {
		super('Preloader')
	}

	preload() {
		this.load.setPath('../assets/')

		this.load.bitmapFont('mago3_black', 'font/mago3_black.png', 'font/mago3_black.xml')

		this.load.image('UI_Flat_FrameSlot03b', 'gui/UI_Flat_FrameSlot03b.png')
		this.load.image('UI_Flat_Frame03a', 'gui/UI_Flat_Frame03a.png')

		this.load.image('Icon_Cursor_02a', 'objects/Icon_Cursor_02a.png')

		this.load.audio('Junkala_Select_2', 'audio/Junkala_Select_2.mp3')
		this.load.audio('Junkala_Stake_2', 'audio/Junkala_Stake_2.mp3')

		this.load.audio('death1', 'audio/death1.mp3')

		this.load.audio('flap1', 'audio/flap1.mp3')
		this.load.audio('flap2', 'audio/flap2.mp3')
		this.load.audio('flap3', 'audio/flap3.mp3')

		this.load.audio('pixelate', 'audio/pixelate.mp3')
		this.load.audio('lightsout', 'audio/lightsout.mp3')

		this.load.audio('grow', 'audio/grow.mp3')
		this.load.audio('shrink', 'audio/shrink.mp3')

		this.load.audio('victory', 'audio/victory.mp3')

		this.load.audio('buttonclick1', 'audio/buttonclick1.mp3')

		this.load.audio('Pickup_Coin_0', 'audio/Pickup_Coin_0.wav')
		this.load.audio('Pickup_Coin_1', 'audio/Pickup_Coin_1.wav')
		this.load.audio('Pickup_Coin_2', 'audio/Pickup_Coin_2.wav')
		this.load.audio('Pickup_Coin_3', 'audio/Pickup_Coin_3.wav')

		this.load.spritesheet('birds', 'birds.png', { frameWidth: 64, frameHeight: 64 })
		this.load.spritesheet('animated_items', 'objects/animated_items.png', { frameWidth: 32, frameHeight: 32 })
		this.load.spritesheet('pipes', 'pipes.png', { frameWidth: 32, frameHeight: 80 })
	}

	create() {
		globalEventEmitter.emit('requestAppSettings')
		this.sound.add('Junkala_Stake_2')
		this.sound.add('Junkala_Select_2')
		this.createAnimations()
		this.scene.start('Menu')
	}

	createAnimations() {
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

		this.anims.create({
			key: 'mystery_box',
			frames: this.anims.generateFrameNumbers('animated_items', {
				start: 8 * 3,
				end: 8 * 3 + 5,
			}),
			frameRate: 12,
			repeat: -1,
		})

		this.anims.create({
			key: 'coin',
			frames: this.anims.generateFrameNumbers('animated_items', {
				start: 0,
				end: 7,
			}),
			frameRate: 12,
			repeat: -1,
		})

		const EMERALD_ROW_INDEX = 7
		const EMERALD_ROW_FRAMES_END = 7
		this.anims.create({
			key: 'emerald',
			frames: this.anims.generateFrameNumbers('animated_items', {
				start: 8 * EMERALD_ROW_INDEX,
				end: 8 * EMERALD_ROW_INDEX + EMERALD_ROW_FRAMES_END,
			}),
			frameRate: 12,
			repeat: -1,
		})

		const SAPPHIRE_ROW_INDEX = 6
		const SAPPHIRE_ROW_FRAMES_END = 7
		this.anims.create({
			key: 'sapphire',
			frames: this.anims.generateFrameNumbers('animated_items', {
				start: 8 * SAPPHIRE_ROW_INDEX,
				end: 8 * SAPPHIRE_ROW_INDEX + SAPPHIRE_ROW_FRAMES_END,
			}),
			frameRate: 12,
			repeat: -1,
		})

		const LIFE_ROW_INDEX = 1
		const LIFE_ROW_FRAMES_END = 5

		this.anims.create({
			key: 'extralife',
			frames: this.anims.generateFrameNumbers('animated_items', {
				start: 8 * LIFE_ROW_INDEX,
				end: 8 * LIFE_ROW_INDEX + LIFE_ROW_FRAMES_END,
			}),
			frameRate: 12,
			repeat: -1,
		})
	}
}
