import { LIVES_REFILL_AMOUNT, type LivesData } from '@birb/shared'
import Phaser from 'phaser'
import { isActiveDailyPost, refreshAppData } from '../api/birbClient'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { getEarthTopY } from '../config/gameplayLayout'
import { HUD_EDGE, HUD_HEART_DISPLAY_W, HUD_ROW_CENTER_Y, HUD_SPRITE_SCALE } from '../config/hudLayout'
import { MagoText, MagoTextStyle } from './MagoText'

const REFILL_ABOVE_EARTH_GAP = 8
const REFILL_ROW_GAP = 4
const REFILL_ICON_GAP = 4

const formatRefillCountdown = (ms: number): string => {
	const totalSec = Math.max(0, Math.ceil(ms / 1000))
	const h = Math.floor(totalSec / 3600)
	const m = Math.floor((totalSec % 3600) / 60)
	const s = totalSec % 60
	return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export class LivesHud extends Phaser.GameObjects.Container {
	private header: Phaser.GameObjects.Container
	private refillColumn?: Phaser.GameObjects.Container
	private heart: Phaser.GameObjects.Sprite
	private countText: MagoText
	private timerText?: MagoText
	private refillPlusText?: MagoText
	private refillHeart?: Phaser.GameObjects.Sprite
	private refillTimeText?: MagoText
	private nextRefillAt: number | null = null
	private countdownTimer?: Phaser.Time.TimerEvent

	constructor(scene: Phaser.Scene, initial: LivesData) {
		super(scene, 0, 0)
		scene.add.existing(this)
		this.setDepth(200)
		this.setScrollFactor(0)

		this.header = scene.add.container(0, 0)
		this.heart = scene.add.sprite(0, 0, 'hearts', 'hearts 0.png').setOrigin(0, 0.5).setScale(HUD_SPRITE_SCALE)
		this.countText = new MagoText(scene, HUD_HEART_DISPLAY_W + 4, 0, String(initial.count), MagoTextStyle.small).setOrigin(0, 0.5)
		this.header.add([this.heart, this.countText])
		this.add(this.header)

		this.setHeartFrame(initial.count)
		this.setLives(initial)
		this.layout()
	}

	setLives = (lives: LivesData): void => {
		this.countText.setText(String(lives.count))
		this.nextRefillAt = lives.nextRefillAt
		this.setHeartFrame(lives.count)
		this.syncTimerVisibility(lives.count)
	}

	/** Show pre-death count, then after delay play the drain animation to the new count. */
	playLifeLostAnimation = (countBefore: number, countAfter: number, delayMs = 500): void => {
		this.countText.setText(String(countBefore))
		this.setHeartFrame(countBefore)

		this.scene.time.delayedCall(delayMs, () => {
			this.heart.play('heart_die')
			this.heart.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
				this.setHeartFrame(countAfter)
				this.countText.setText(String(countAfter))
				this.syncTimerVisibility(countAfter)
			})
		})
	}

	private setHeartFrame = (count: number): void => {
		this.heart.setFrame(count > 0 ? 'hearts 0.png' : 'hearts 4.png')
	}

	private clearRefillCountdown = (): void => {
		this.refillColumn?.destroy(true)
		this.refillColumn = undefined
		this.timerText = undefined
		this.refillPlusText = undefined
		this.refillHeart = undefined
		this.refillTimeText = undefined
	}

	private syncTimerVisibility = (count: number): void => {
		this.countdownTimer?.remove()
		this.countdownTimer = undefined
		this.clearRefillCountdown()

		if (count > 0 || !this.nextRefillAt) return

		this.refillColumn = this.scene.add.container(0, 0)
		this.add(this.refillColumn)

		if (isActiveDailyPost()) {
			this.refillPlusText = new MagoText(this.scene, 0, 0, `+${LIVES_REFILL_AMOUNT}`, MagoTextStyle.small)
			this.refillHeart = this.scene.add.sprite(0, 0, 'hearts', 'hearts 0.png').setOrigin(0, 0.5).setScale(HUD_SPRITE_SCALE)
			this.refillTimeText = new MagoText(this.scene, 0, 0, '', MagoTextStyle.small)
			this.refillColumn.add([this.refillPlusText, this.refillHeart, this.refillTimeText])
		} else {
			this.timerText = new MagoText(this.scene, 0, 0, '', MagoTextStyle.small)
			this.refillColumn.add(this.timerText)
		}

		const tick = (): void => {
			if (!this.nextRefillAt) return
			const remaining = this.nextRefillAt - Date.now()
			if (remaining <= 0) {
				if (this.refillTimeText) this.refillTimeText.setText('Refilling…')
				else this.timerText?.setText('Refilling…')
				this.layoutRefillColumnContent()
				void refreshAppData().then((appData) => {
					if (appData?.lives) this.setLives(appData.lives)
				})
				return
			}
			const time = formatRefillCountdown(remaining)
			if (this.refillTimeText) this.refillTimeText.setText(`in ${time}`)
			else this.timerText?.setText(time)
		}

		tick()
		this.layoutRefillColumn()
		this.countdownTimer = this.scene.time.addEvent({ delay: 1000, loop: true, callback: tick })
	}

	private layoutRefillColumnContent = (): void => {
		if (!this.refillColumn) return

		const lineH = MagoTextStyle.small

		if (this.refillPlusText && this.refillHeart && this.refillTimeText) {
			const row1W = this.refillPlusText.width + REFILL_ICON_GAP + HUD_HEART_DISPLAY_W
			const blockH = lineH * 2 + REFILL_ROW_GAP
			const row1Y = -blockH / 2 + lineH / 2
			const row2Y = blockH / 2 - lineH / 2

			this.refillPlusText.setPosition(-row1W / 2, row1Y).setOrigin(0, 0.5)
			this.refillHeart.setPosition(-row1W / 2 + this.refillPlusText.width + REFILL_ICON_GAP, row1Y)
			this.refillTimeText.setPosition(0, row2Y).setOrigin(0.5, 0.5)
			return
		}

		if (this.timerText) {
			this.timerText.setPosition(0, 0).setOrigin(0.5, 0.5)
		}
	}

	private layoutRefillColumn = (): void => {
		if (!this.refillColumn) return

		const width = layoutWidth(this.scene)
		const height = layoutHeight(this.scene)
		const earthTopY = getEarthTopY(height)
		const lineH = MagoTextStyle.small
		const blockH =
			this.refillPlusText && this.refillTimeText ? lineH * 2 + REFILL_ROW_GAP : lineH
		const blockBottom = earthTopY - REFILL_ABOVE_EARTH_GAP

		this.layoutRefillColumnContent()
		this.refillColumn.setPosition(width / 2, blockBottom - blockH / 2)
	}

	layout = (): void => {
		this.header.setPosition(HUD_EDGE, HUD_ROW_CENTER_Y)
		this.layoutRefillColumn()
	}

	getCount = (): number => Number(this.countText.text) || 0

	destroy = (fromScene?: boolean): void => {
		this.countdownTimer?.remove()
		super.destroy(fromScene)
	}
}

export const readLivesFromRegistry = (scene: Phaser.Scene): LivesData => {
	const fromRegistry = scene.registry.get('lives') as LivesData | undefined
	if (fromRegistry) return fromRegistry
	return { count: 25, nextRefillAt: null, freeCap: 25 }
}
