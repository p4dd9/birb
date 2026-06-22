import type { Scene } from 'phaser'
import { layoutHeight, layoutWidth } from '../cameraScale'
import { PipeGaps } from './pipe.config'

/** Fixed internal game resolution — display scaling is handled by Phaser Scale.FIT. */
export const REF_WIDTH = 480
export const REF_HEIGHT = 720
const REF_EARTH = 32
/** Matches `Game` earth TileSprite `setScale(5)`. */
const REF_EARTH_DISPLAY_SCALE = 5
const REF_SCORE_TOP = 40
const REF_PIPE_WIDTH = 100
const REF_PLAYER_X = 175
const REF_SPAWN_MARGIN = 50
const REF_PIPE_SPAWN_DELAY_MS = 1500
/** Extra breathing room before the first pipe — player is still settling after the start tap. */
const REF_PIPE_FIRST_SPAWN_DELAY_MS = 1250
const REF_PIPE_SCROLL_SPEED = 1.3 * 3.5
const REF_SCORE_ZONE_HEIGHT = 150
const REF_PIPE_CENTER_MIN = 100
const REF_PIPE_CENTER_MAX = 400
const REF_PIPE_WOBBLE = 100

const REF_PLAY_HEIGHT = REF_HEIGHT - REF_EARTH - REF_SCORE_TOP

/** Top edge of the scrolling ground strip (earth TileSprite is center-anchored). */
export const getEarthTopY = (height: number, scaleY = 1): number => {
	const earthH = REF_EARTH * scaleY
	const earthCenterY = height - earthH
	return earthCenterY - (earthH * REF_EARTH_DISPLAY_SCALE) / 2
}

export type GameplayLayout = {
	width: number
	height: number
	scaleX: number
	scaleY: number
	playTop: number
	playBottom: number
	playHeight: number
	pipeWidth: number
	pipeCenterMinY: number
	pipeCenterMaxY: number
	playerStartX: number
	playerStartY: number
	pipeSpawnX: number
	pipeScrollSpeed: number
	pipeSpawnDelayMs: number
	pipeFirstSpawnDelayMs: number
	scoreZoneHeight: number
	pipeWobbleY: number
	gapScale: number
}

/** Gameplay constants in fixed world coordinates (480×720). */
export const getGameplayLayout = (scene: Scene): GameplayLayout => {
	const width = layoutWidth(scene)
	const height = layoutHeight(scene)
	const scaleX = 1
	const scaleY = 1

	return {
		width,
		height,
		scaleX,
		scaleY,
		playTop: REF_SCORE_TOP,
		playBottom: height - REF_EARTH,
		playHeight: REF_PLAY_HEIGHT,
		pipeWidth: REF_PIPE_WIDTH,
		pipeCenterMinY: REF_PIPE_CENTER_MIN,
		pipeCenterMaxY: REF_PIPE_CENTER_MAX,
		playerStartX: REF_PLAYER_X,
		playerStartY: getEarthTopY(height, scaleY) / 2,
		pipeSpawnX: width + REF_SPAWN_MARGIN,
		pipeScrollSpeed: REF_PIPE_SCROLL_SPEED,
		pipeSpawnDelayMs: REF_PIPE_SPAWN_DELAY_MS,
		pipeFirstSpawnDelayMs: REF_PIPE_FIRST_SPAWN_DELAY_MS,
		scoreZoneHeight: REF_SCORE_ZONE_HEIGHT,
		pipeWobbleY: REF_PIPE_WOBBLE,
		gapScale: 1,
	}
}

/** Pipe gap in fixed world px (same difficulty on every device). */
export const scalePipeGap = (_scene: Scene, gap: PipeGaps): number => gap
