import Phaser from 'phaser'

/** Flat-theme frame variants (96×64 source). */
export const PANEL_FRAME_GRAY = 'UI_Flat_Frame01a.png'
export const PANEL_FRAME_BLUE = 'UI_Flat_Frame02a.png'
export const PANEL_FRAME_ORANGE = 'UI_Flat_Frame03a.png'

/** Corner inset preserved by the nine-slice (px in source art). */
const PANEL_SLICE = 12

/**
 * Build the themed nine-slice background panel shared by the modal scenes.
 * Sits just under the modal content (depth 501; overlay is 500, content 502+).
 */
export const createNinePanel = (
	scene: Phaser.Scene,
	cx: number,
	cy: number,
	width: number,
	height: number,
	frame: string = PANEL_FRAME_GRAY
): Phaser.GameObjects.NineSlice =>
	scene.add
		.nineslice(cx, cy, 'gui_theme', frame, width, height, PANEL_SLICE, PANEL_SLICE, PANEL_SLICE, PANEL_SLICE)
		.setOrigin(0.5)
		.setDepth(501)
