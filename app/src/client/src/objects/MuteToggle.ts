import Phaser from 'phaser'
import { layoutWidth } from '../cameraScale'
import { HUD_EDGE, HUD_SOUND_SCALE } from '../config/hudLayout'
import { applyMuteToGame, loadMutedPref, saveMutedPref } from '../util/audioPrefs'
import { BIRB_CURSOR } from '../util/dom'

const SOUND_ICON_FRAME_ON = 'musicOff 1.png'
const SOUND_ICON_FRAME_OFF = 'musicOff 0.png'

const soundIconFrame = (muted: boolean): string => (muted ? SOUND_ICON_FRAME_OFF : SOUND_ICON_FRAME_ON)

export class MuteToggle extends Phaser.GameObjects.Container {
	private icon: Phaser.GameObjects.Image

	constructor(scene: Phaser.Scene) {
		super(scene, 0, 0)
		scene.add.existing(this)
		this.setDepth(200)
		this.setScrollFactor(0)

		const muted = loadMutedPref()
		this.icon = scene.add
			.image(0, 0, 'sound_icon', soundIconFrame(muted))
			.setOrigin(1, 0)
			.setScale(HUD_SOUND_SCALE)
			.setInteractive({ cursor: BIRB_CURSOR })
			.on('pointerdown', this.toggle, this)

		this.add(this.icon)
		this.setMutedVisual(muted)
		applyMuteToGame(scene.game, muted)
		this.syncOnUnlock()
		this.layout()
	}

	private setMutedVisual = (muted: boolean): void => {
		this.icon.setFrame(soundIconFrame(muted))
	}

	private syncOnUnlock = (): void => {
		if (!this.scene.sound.locked) return
		this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
			const muted = loadMutedPref()
			applyMuteToGame(this.scene.game, muted)
			this.setMutedVisual(muted)
		})
	}

	private toggle = (): void => {
		const nextMuted = !this.scene.game.sound.mute
		this.scene.sound.setMute(nextMuted)
		applyMuteToGame(this.scene.game, nextMuted)
		saveMutedPref(nextMuted)
		this.setMutedVisual(nextMuted)

		if (!this.scene.sound.locked && !nextMuted) {
			this.scene.sound.play('buttonclick1', { volume: 0.5 })
		}
	}

	layout = (): void => {
		this.setPosition(layoutWidth(this.scene) - HUD_EDGE, HUD_EDGE)
	}
}
