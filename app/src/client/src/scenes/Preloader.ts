import { PLAYER_FRAME_COUNT } from '@birb/shared/keys'
import Phaser from 'phaser'
import { birbBridge } from '../api/birbBridge'
import { getDailyNumber, isActiveDailyPost, isDailyPost } from '../api/birbClient'
// import { bindSceneCameraScale } from '../cameraScale'
import { birbFlapAnimKey, birbFlapFrameNames, birbFlapRepeatAnimKey } from '../config/birbs.config'
import {
	FIREWORK_VARIANTS,
	fireworkAnimKey,
	fireworkFrameName,
	type FireworkVariant,
} from '../config/fireworks.config'

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

		// this.load.audio('Junkala_Select_2', 'audio/Junkala_Select_2.mp3')
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

		this.load.audio('Pickup_Coin_0', 'audio/Pickup_Coin_0.mp3')
		this.load.audio('Pickup_Coin_1', 'audio/Pickup_Coin_1.mp3')
		this.load.audio('Pickup_Coin_2', 'audio/Pickup_Coin_2.mp3')
		this.load.audio('Pickup_Coin_3', 'audio/Pickup_Coin_3.mp3')

		this.load.audio('PickupKey_1', 'audio/PickupKey_1.mp3')
		this.load.audio('PickupKey_2', 'audio/PickupKey_2.mp3')
		this.load.audio('PickupKey_3', 'audio/PickupKey_3.mp3')
		this.load.audio('Pipes_Down1', 'audio/Pipes_Down1.mp3')
		this.load.audio('explo1', 'audio/explo1.mp3')
		this.load.audio('explo2', 'audio/explo2.mp3')

		this.load.atlas('birbs', 'birbs.png', 'birbs.json')

		this.load.atlas('hearts', 'gui/hearts.png', 'gui/hearts.json')
		this.load.atlas('sound_icon', 'gui/sound_icon.png', 'gui/sound_icon.json')
		this.load.atlas('fireworks', 'objects/fireworks.png', 'objects/fireworks.json')
		this.load.image('hearts_portrait', 'gui/hearts_portrait.png')

		this.load.spritesheet('animated_items', 'objects/animated_items.png', { frameWidth: 32, frameHeight: 32 })
		this.load.spritesheet('pipes', 'pipes.png', { frameWidth: 32, frameHeight: 80 })
		this.load.spritesheet(
			'Spritesheet_Animation_UI_Pumpkin_Arrow',
			'gui/Spritesheet_Animation_UI_Pumpkin_Arrow.png',
			{ frameWidth: 32, frameHeight: 32 }
		)
	}

	create() {
		// bindSceneCameraScale(this)

		// Pixel HUD art — avoid linear filtering bleeding atlas gutters / AA fringes.
		this.textures.get('sound_icon').setFilter(Phaser.Textures.FilterMode.NEAREST)
		this.textures.get('fireworks').setFilter(Phaser.Textures.FilterMode.NEAREST)

		this.sound.add('Junkala_Stake_2')
		// this.sound.add('Junkala_Select_2')

		this.createAnimations()

		if (isDailyPost()) {
			const appData = birbBridge.getAppData()
			const postDaily = getDailyNumber()
			const isActive = isActiveDailyPost(appData) && postDaily !== undefined
			this.scene.start(isActive ? 'Game' : 'Menu')
			return
		}

		this.scene.start('Menu')
	}

	createAnimations() {
		for (let playerFrame = 0; playerFrame < PLAYER_FRAME_COUNT; playerFrame++) {
			const frames = birbFlapFrameNames(playerFrame).map((frame) => ({ key: 'birbs', frame }))

			this.anims.create({
				key: birbFlapAnimKey(playerFrame),
				frames,
				frameRate: 12,
				repeat: 0,
			})

			this.anims.create({
				key: birbFlapRepeatAnimKey(playerFrame),
				frames,
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

		this.anims.create({
			key: 'heart_still',
			frames: [{ key: 'hearts', frame: 'hearts 0.png' }],
		})

		this.anims.create({
			key: 'heart_die',
			frames: this.anims.generateFrameNames('hearts', {
				prefix: 'hearts ',
				start: 0,
				end: 4,
				suffix: '.png',
			}),
			frameRate: 10,
			repeat: 0,
		})

		for (const variant of FIREWORK_VARIANTS) {
			this.createFireworkAnimations(variant)
		}
	}

	createFireworkAnimations = (variant: FireworkVariant): void => {
		this.anims.create({
			key: fireworkAnimKey(variant, 'lift'),
			frames: [{ key: 'fireworks', frame: fireworkFrameName(variant, 0) }],
			frameRate: 12,
		})

		this.anims.create({
			key: fireworkAnimKey(variant, 'fly'),
			frames: [1, 2].map((frame) => ({ key: 'fireworks', frame: fireworkFrameName(variant, frame) })),
			frameRate: 12,
			repeat: -1,
		})

		this.anims.create({
			key: fireworkAnimKey(variant, 'explode'),
			frames: [3, 4, 5, 6].map((frame) => ({ key: 'fireworks', frame: fireworkFrameName(variant, frame) })),
			frameRate: 12,
			repeat: 0,
		})
	}
}
