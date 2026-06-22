export const FIREWORK_VARIANTS = ['Yellow', 'Purple', 'Pink'] as const
export type FireworkVariant = (typeof FIREWORK_VARIANTS)[number]

export const fireworkAnimKey = (variant: FireworkVariant, phase: 'lift' | 'fly' | 'explode'): string =>
	`fireworks_${variant.toLowerCase()}_${phase}`

export const fireworkFrameName = (variant: FireworkVariant, frame: number): string => `1 (${variant}) ${frame}.png`

/** Behind the earth strip (`Game` earth depth is 50). */
export const FIREWORK_DEPTH = 49

export const FIREWORK_BURST_COUNT = 6
export const FIREWORK_MIN_ACTIVE = 2
export const FIREWORK_MAX_ACTIVE = 4
export const FIREWORK_EXPLODE_SOUNDS = ['explo1', 'explo2'] as const
export const FIREWORK_EXPLODE_VOLUME = 0.06
export const FIREWORK_EXPLODE_PITCH_MIN = 1.0
export const FIREWORK_EXPLODE_PITCH_MAX = 1.12

export const FIREWORK_SCALE_MIN = 0.92
export const FIREWORK_SCALE_MAX = 1.22
export const FIREWORK_SPEED_MULT_MIN = 0.92
export const FIREWORK_SPEED_MULT_MAX = 1.18
export const FIREWORK_TARGET_Y_CENTER_OFFSET = -40
export const FIREWORK_TARGET_Y_SPREAD_UP = 80
export const FIREWORK_TARGET_Y_SPREAD_DOWN = 25
export const FIREWORK_TARGET_X_SPREAD = 90
export const FIREWORK_FLIGHT_SPEED_MIN = 250
export const FIREWORK_FLIGHT_SPEED_MAX = 350
