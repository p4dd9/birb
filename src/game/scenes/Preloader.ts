export class Preloader extends Phaser.Scene {
	constructor() {
		super('Preloader')
	}

	preload() {
		this.load.setPath('../assets/')

		this.load.image('UI_Flat_FrameSlot03b', 'gui/UI_Flat_FrameSlot03b.png')
		this.load.image('UI_Flat_Frame03a', 'gui/UI_Flat_Frame03a.png')

		this.load.image('Icon_Cursor_02a', 'objects/Icon_Cursor_02a.png')
		this.load.image('earth', 'foreground/earth.png')

		this.load.spritesheet('rain_light_32x128', 'objects/rain_light_32x128.png', {
			frameWidth: 32,
			frameHeight: 128,
		})

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

		this.load.audio('PickupKey_1', 'audio/PickupKey_1.mp3')
		this.load.audio('PickupKey_2', 'audio/PickupKey_2.mp3')
		this.load.audio('PickupKey_3', 'audio/PickupKey_3.mp3')
		this.load.audio('Pipes_Down1', 'audio/Pipes_Down1.mp3')

		this.load.spritesheet('birbs', 'birbs.png', { frameWidth: 64, frameHeight: 64 })
		this.load.spritesheet('birbs2', 'birbs2.png', { frameWidth: 64, frameHeight: 64 })

		this.load.spritesheet('animated_items', 'objects/animated_items.png', { frameWidth: 32, frameHeight: 32 })
		this.load.spritesheet('pipes', 'pipes.png', { frameWidth: 32, frameHeight: 80 })
		this.load.spritesheet(
			'Spritesheet_Animation_UI_Pumpkin_Arrow',
			'gui/Spritesheet_Animation_UI_Pumpkin_Arrow.png',
			{ frameWidth: 32, frameHeight: 32 }
		)
	}

	create() {
		this.sound.add('Junkala_Stake_2')
		this.sound.add('Junkala_Select_2')

		this.createAnimations()

		this.scene.start('Menu')
	}

	createAnimations() {
		for (let row = 0; row < 8; row++) {
			this.anims.create({
				key: `flap_${row}`,
				frames: this.anims.generateFrameNumbers('birbs', {
					start: row * 4,
					end: row * 4 + 3,
				}),
				frameRate: 12,
				repeat: 0,
			})

			this.anims.create({
				key: `flap_${row}_repeat`,
				frames: this.anims.generateFrameNumbers('birbs', {
					start: row * 4,
					end: row * 4 + 3,
				}),
				frameRate: 9,
				repeat: -1,
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

		/** KEYS */
		const BRONZE_KEY_START = 12
		const SILVER_KEY_START = 13
		const GOLD_KEY_START = 14
		const KEYS_ROW_FRAME_END = 7

		this.anims.create({
			key: 'bronze_key',
			frames: this.anims.generateFrameNumbers('animated_items', {
				start: 8 * BRONZE_KEY_START,
				end: 8 * BRONZE_KEY_START + KEYS_ROW_FRAME_END,
			}),
			frameRate: 12,
			repeat: -1,
		})

		this.anims.create({
			key: 'silver_key',
			frames: this.anims.generateFrameNumbers('animated_items', {
				start: 8 * SILVER_KEY_START,
				end: 8 * SILVER_KEY_START + KEYS_ROW_FRAME_END,
			}),
			frameRate: 12,
			repeat: -1,
		})

		this.anims.create({
			key: 'gold_key',
			frames: this.anims.generateFrameNumbers('animated_items', {
				start: 8 * GOLD_KEY_START,
				end: 8 * GOLD_KEY_START + KEYS_ROW_FRAME_END,
			}),
			frameRate: 12,
			repeat: -1,
		})

		this.anims.create({
			key: 'arrows',
			frames: this.anims.generateFrameNumbers('Spritesheet_Animation_UI_Pumpkin_Arrow', {
				start: 0,
				end: 2,
			}),
			frameRate: 12,
		})
	}
}
