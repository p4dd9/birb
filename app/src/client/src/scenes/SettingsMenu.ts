import type { AppData } from '@birb/shared'
import { clientLogger } from '@birb/shared'
import { context, showToast } from '@devvit/web/client'
import { birbBridge } from '../api/birbBridge'
import { optInPush, optOutPush, saveAudioPref, subscribe, unsubscribe } from '../api/birbClient'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { createNinePanel, PANEL_FRAME_BLUE } from '../objects/NinePanel'
import { MagoText, MagoTextStyle } from '../objects/MagoText'
import { applyMuteToGame, AUDIO_MUTE_EVENT, loadMutedPref, saveMutedPref } from '../util/audioPrefs'
import { BIRB_CURSOR } from '../util/dom'

const PANEL_OUTER_INSET = 24
const PANEL_INNER_PAD = 36
const TITLE_TOP_OFFSET = 56
const ROWS_TOP_OFFSET = 130
const ROW_GAP = 96
const TOGGLE_SCALE = 4
const TOGGLE_ON = 'UI_Flat_ToggleOn03a.png'
const TOGGLE_OFF = 'UI_Flat_ToggleOff03a.png'
const VERSION_BOTTOM_INSET = 26
const CLOSE_BOTTOM_INSET = 70

type ToggleRow = {
	sprite: Phaser.GameObjects.Image
	getValue: () => boolean
}

export class SettingsMenu extends Phaser.Scene {
	private following = false
	private notifying = false
	private audioOn = false
	private busyFollow = false
	private busyNotify = false
	private busyAudio = false

	constructor() {
		super('SettingsMenu')
	}

	create() {
		const width = layoutWidth(this)
		const height = layoutHeight(this)
		const centerX = width / 2
		const centerY = height / 2

		const appData = birbBridge.getAppData()
		this.following = appData?.subscribed ?? false
		this.notifying = appData?.pushNotifications ?? false
		this.audioOn = !loadMutedPref()

		this.add.rectangle(centerX, centerY, width, height, 0x000000, 0.72).setInteractive().setDepth(500)

		const panelWidth = Math.min(440, width - PANEL_OUTER_INSET * 2)
		const panelHeight = Math.min(520, height - PANEL_OUTER_INSET * 2)
		const panelTop = centerY - panelHeight / 2
		const panelBottom = centerY + panelHeight / 2
		const rowLeft = centerX - panelWidth / 2 + PANEL_INNER_PAD
		const rowRight = centerX + panelWidth / 2 - PANEL_INNER_PAD

		createNinePanel(this, centerX, centerY, panelWidth, panelHeight, PANEL_FRAME_BLUE)

		new MagoText(this, centerX, panelTop + TITLE_TOP_OFFSET, 'Settings', MagoTextStyle.bigger)
			.setOrigin(0.5)
			.setDepth(502)

		this.followRow = this.addToggleRow(
			rowLeft,
			rowRight,
			panelTop + ROWS_TOP_OFFSET,
			'Subscribe',
			() => this.following,
			() => void this.onToggleFollow()
		)
		this.notifyRow = this.addToggleRow(
			rowLeft,
			rowRight,
			panelTop + ROWS_TOP_OFFSET + ROW_GAP,
			'Notifications',
			() => this.notifying,
			() => void this.onToggleNotify()
		)
		this.audioRow = this.addToggleRow(
			rowLeft,
			rowRight,
			panelTop + ROWS_TOP_OFFSET + ROW_GAP * 2,
			'Audio',
			() => this.audioOn,
			() => void this.onToggleAudio()
		)

		this.game.events.on(AUDIO_MUTE_EVENT, this.onExternalMuteChange, this)

		new MagoText(this, centerX, panelBottom - VERSION_BOTTOM_INSET, `v${context.appVersion}`, MagoTextStyle.small)
			.setOrigin(0.5, 1)
			.setDepth(502)
			.setAlpha(0.7)

		const closeY = panelBottom - CLOSE_BOTTOM_INSET
		const closeLabel = new MagoText(this, centerX, closeY, 'Close', MagoTextStyle.small)
			.setOrigin(0.5)
			.setDepth(503)
		const closeButton = this.add
			.image(centerX, closeY, 'UI_Flat_Frame03a')
			.setOrigin(0.5)
			.setDisplaySize(closeLabel.width + 64, 56)
			.setInteractive({ cursor: BIRB_CURSOR })
			.setDepth(502)
			.on('pointerdown', () => {
				this.sound.play('buttonclick1', { volume: 0.5 })
				this.close()
			})
		closeButton.setPosition(centerX, closeY)

		this.scale.on('resize', this.resize, this)
	}

	private followRow?: ToggleRow
	private notifyRow?: ToggleRow
	private audioRow?: ToggleRow

	private addToggleRow = (
		left: number,
		right: number,
		y: number,
		label: string,
		getValue: () => boolean,
		onToggle: () => void
	): ToggleRow => {
		new MagoText(this, left, y, label, MagoTextStyle.small).setOrigin(0, 0.5).setDepth(502)

		const sprite = this.add
			.image(right, y, 'gui_theme', getValue() ? TOGGLE_ON : TOGGLE_OFF)
			.setOrigin(1, 0.5)
			.setScale(TOGGLE_SCALE)
			.setInteractive({ cursor: BIRB_CURSOR })
			.setDepth(502)
			.on('pointerdown', onToggle)

		return { sprite, getValue }
	}

	private syncToggle = (row?: ToggleRow): void => {
		if (!row) return
		row.sprite.setFrame(row.getValue() ? TOGGLE_ON : TOGGLE_OFF)
	}

	/** Re-sync the audio row when the HUD mute icon changes the pref. */
	private onExternalMuteChange = (muted: boolean): void => {
		this.audioOn = !muted
		this.syncToggle(this.audioRow)
	}

	/** Optimistically mirror a setting into the cached app data so other scenes agree. */
	private patchAppData = (patch: Partial<AppData>): void => {
		const appData = birbBridge.getAppData()
		if (appData) birbBridge.setAppData({ ...appData, ...patch })
	}

	private onToggleFollow = async (): Promise<void> => {
		if (this.busyFollow) return
		this.busyFollow = true
		this.sound.play('buttonclick1', { volume: 0.5 })

		const next = !this.following
		this.following = next
		this.syncToggle(this.followRow)
		this.patchAppData({ subscribed: next })

		try {
			await (next ? subscribe() : unsubscribe())
			showToast(next ? 'Subscribed!' : 'Unsubscribed')
		} catch (error) {
			clientLogger.error('Failed to update subscription', error)
			showToast("Couldn't update follow — try again")
		} finally {
			this.busyFollow = false
		}
	}

	private onToggleNotify = async (): Promise<void> => {
		if (this.busyNotify) return
		this.busyNotify = true
		this.sound.play('buttonclick1', { volume: 0.5 })

		const next = !this.notifying
		this.notifying = next
		this.syncToggle(this.notifyRow)
		this.patchAppData({ pushNotifications: next })

		try {
			await (next ? optInPush() : optOutPush())
			showToast(next ? 'Notifications on' : 'Notifications off')
		} catch (error) {
			clientLogger.error('Failed to update notifications', error)
			showToast("Couldn't update notifications — try again")
		} finally {
			this.busyNotify = false
		}
	}

	private onToggleAudio = async (): Promise<void> => {
		if (this.busyAudio) return
		this.busyAudio = true

		const audioOn = !this.audioOn
		const muted = !audioOn
		this.audioOn = audioOn
		this.syncToggle(this.audioRow)

		// Apply + persist locally right away so the change takes effect this session,
		// and broadcast so the HUD mute toggle icon re-syncs.
		this.sound.setMute(muted)
		applyMuteToGame(this.game, muted)
		saveMutedPref(muted)
		this.game.events.emit(AUDIO_MUTE_EVENT, muted)
		if (audioOn) this.sound.play('buttonclick1', { volume: 0.5 })

		try {
			await saveAudioPref(muted)
			showToast(audioOn ? 'Audio on' : 'Audio off')
		} catch (error) {
			clientLogger.error('Failed to save audio preference', error)
			showToast("Couldn't save audio setting — try again")
		} finally {
			this.busyAudio = false
		}
	}

	close = (): void => {
		this.game.events.off(AUDIO_MUTE_EVENT, this.onExternalMuteChange, this)
		this.scale.off('resize', this.resize, this)
		this.scene.stop('SettingsMenu')
	}

	resize = (): void => {
		this.scene.restart()
	}
}

export const openSettingsMenu = (scene: Phaser.Scene): void => {
	if (scene.scene.isActive('SettingsMenu')) return
	scene.scene.launch('SettingsMenu')
	scene.scene.bringToTop('SettingsMenu')
}
