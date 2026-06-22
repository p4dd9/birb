import {
	FIREWORK_DEPTH,
	FIREWORK_EXPLODE_PITCH_MAX,
	FIREWORK_EXPLODE_PITCH_MIN,
	FIREWORK_EXPLODE_SOUNDS,
	FIREWORK_EXPLODE_VOLUME,
	FIREWORK_FLIGHT_SPEED_MAX,
	FIREWORK_FLIGHT_SPEED_MIN,
	FIREWORK_MAX_ACTIVE,
	FIREWORK_MIN_ACTIVE,
	FIREWORK_SCALE_MAX,
	FIREWORK_SCALE_MIN,
	FIREWORK_SPEED_MULT_MAX,
	FIREWORK_SPEED_MULT_MIN,
	FIREWORK_TARGET_X_SPREAD,
	FIREWORK_TARGET_Y_CENTER_OFFSET,
	FIREWORK_TARGET_Y_SPREAD_DOWN,
	FIREWORK_TARGET_Y_SPREAD_UP,
	FIREWORK_VARIANTS,
	fireworkAnimKey,
	fireworkFrameName,
	type FireworkVariant,
} from '../config/fireworks.config'
import type { Game } from '../scenes/Game'
import { layoutHeight, layoutWidth } from '../cameraScale'

type FireworkPhase = 'liftoff' | 'fly' | 'explode'
type FireworkMode = 'idle' | 'burst' | 'loop'

type ActiveFirework = {
	sprite: Phaser.GameObjects.Sprite
	variant: FireworkVariant
	phase: FireworkPhase
	vx: number
	vy: number
	targetX: number
	targetY: number
	flightDuration: number
	elapsed: number
	liftoffEndTime: number
}

export class FireworksManager {
	scene: Game
	active: ActiveFirework[] = []
	mode: FireworkMode = 'idle'
	private burstSpawnRemaining = 0

	constructor(scene: Game) {
		this.scene = scene
	}

	playBurst = (count: number): void => {
		if (this.mode === 'loop') return
		this.mode = 'burst'
		this.burstSpawnRemaining = count
		this.scene.events.on('update', this.update, this)

		for (let i = 0; i < count; i++) {
			this.scene.time.delayedCall(i * Phaser.Math.Between(180, 320), () => {
				if (this.mode !== 'burst') return
				this.spawnFirework()
				this.burstSpawnRemaining--
			})
		}
	}

	startLoop = (): void => {
		this.mode = 'loop'
		this.burstSpawnRemaining = 0
		this.scene.events.on('update', this.update, this)
		this.spawnFirework()
		this.scene.time.delayedCall(Phaser.Math.Between(400, 1200), () => {
			if (this.mode === 'loop' && this.active.length < FIREWORK_MAX_ACTIVE) {
				this.spawnFirework()
			}
		})
	}

	stop = (): void => {
		this.mode = 'idle'
		this.burstSpawnRemaining = 0
		this.scene.events.off('update', this.update, this)
		for (const firework of this.active) {
			firework.sprite.destroy()
		}
		this.active = []
	}

	spawnFirework = (): void => {
		if (this.mode === 'loop' && this.active.length >= FIREWORK_MAX_ACTIVE) return

		const variant = Phaser.Utils.Array.GetRandom([...FIREWORK_VARIANTS])
		const scale = Phaser.Math.FloatBetween(FIREWORK_SCALE_MIN, FIREWORK_SCALE_MAX)
		const speedMult = Phaser.Math.FloatBetween(FIREWORK_SPEED_MULT_MIN, FIREWORK_SPEED_MULT_MAX)
		const width = layoutWidth(this.scene)
		const height = layoutHeight(this.scene)

		const startX = Phaser.Math.Between(48, width - 48)
		const startY = height - 6

		const targetX = width / 2 + Phaser.Math.Between(-FIREWORK_TARGET_X_SPREAD, FIREWORK_TARGET_X_SPREAD)
		const targetY =
			height / 2 +
			FIREWORK_TARGET_Y_CENTER_OFFSET +
			Phaser.Math.Between(-FIREWORK_TARGET_Y_SPREAD_UP, FIREWORK_TARGET_Y_SPREAD_DOWN)

		const dx = targetX - startX
		const dy = targetY - startY
		const distance = Math.hypot(dx, dy)
		const flightDuration = (distance / Phaser.Math.FloatBetween(FIREWORK_FLIGHT_SPEED_MIN, FIREWORK_FLIGHT_SPEED_MAX)) / speedMult
		const vx = dx / flightDuration
		const vy = dy / flightDuration
		const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY)

		const sprite = this.scene.add
			.sprite(startX, startY, 'fireworks', fireworkFrameName(variant, 0))
			.setDepth(FIREWORK_DEPTH)
			.setScale(scale)
			.setRotation(angle + Math.PI / 2)

		sprite.play(fireworkAnimKey(variant, 'lift'))

		this.active.push({
			sprite,
			variant,
			phase: 'liftoff',
			vx,
			vy,
			targetX,
			targetY,
			flightDuration,
			elapsed: 0,
			liftoffEndTime: this.scene.time.now + 160,
		})
	}

	beginExplode = (firework: ActiveFirework): void => {
		firework.phase = 'explode'
		firework.sprite.setPosition(firework.targetX, firework.targetY)
		firework.sprite.setRotation(0)

		const explodeKey = Phaser.Utils.Array.GetRandom([...FIREWORK_EXPLODE_SOUNDS])
		this.scene.sound.play(explodeKey, {
			volume: FIREWORK_EXPLODE_VOLUME,
			rate: Phaser.Math.FloatBetween(FIREWORK_EXPLODE_PITCH_MIN, FIREWORK_EXPLODE_PITCH_MAX),
		})

		firework.sprite.play(fireworkAnimKey(firework.variant, 'explode'))
		firework.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
			this.removeFirework(firework)
		})
	}

	removeFirework = (firework: ActiveFirework): void => {
		const index = this.active.indexOf(firework)
		if (index >= 0) {
			this.active.splice(index, 1)
		}
		firework.sprite.destroy()

		if (this.mode === 'loop') {
			this.scene.time.delayedCall(Phaser.Math.Between(250, 900), () => {
				this.replenish()
			})
			return
		}

		if (this.mode === 'burst' && this.active.length === 0 && this.burstSpawnRemaining <= 0) {
			this.mode = 'idle'
			this.scene.events.off('update', this.update, this)
		}
	}

	replenish = (): void => {
		if (this.mode !== 'loop') return

		while (this.active.length < FIREWORK_MIN_ACTIVE) {
			this.spawnFirework()
		}

		if (this.active.length < FIREWORK_MAX_ACTIVE && Phaser.Math.Between(1, 100) <= 55) {
			this.spawnFirework()
		}
	}

	update = (_time: number, delta: number): void => {
		const dt = delta / 1000

		for (const firework of this.active) {
			if (firework.phase === 'explode') continue

			if (firework.phase === 'liftoff' && this.scene.time.now >= firework.liftoffEndTime) {
				firework.phase = 'fly'
				firework.sprite.play(fireworkAnimKey(firework.variant, 'fly'))
			}

			firework.sprite.x += firework.vx * dt
			firework.sprite.y += firework.vy * dt
			firework.elapsed += dt

			if (firework.phase !== 'fly') continue

			const dist = Phaser.Math.Distance.Between(firework.sprite.x, firework.sprite.y, firework.targetX, firework.targetY)
			if (dist < 24 || firework.elapsed >= firework.flightDuration) {
				this.beginExplode(firework)
			}
		}
	}
}
