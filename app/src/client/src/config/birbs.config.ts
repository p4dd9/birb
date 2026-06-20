/** Aseprite atlas layer order in `birbs.json` (rows top → bottom). */
export const BIRB_CHARACTERS = ['Blue', 'Brown', 'White', 'Green', 'Purple', 'Red', 'Orange'] as const

/** Native frame size in the atlas (px). */
export const BIRB_FRAME_SIZE = 16

/** Scale small atlas frames up to the original ~64px gameplay size. */
export const BIRB_DISPLAY_SCALE = 4

const atlasFrame = (character: string, frame: number) => `birbs (${character}) ${frame}.png`

export const birbStillFrame = (playerFrame: number) =>
	atlasFrame(BIRB_CHARACTERS[playerFrame % BIRB_CHARACTERS.length]!, 0)

export const birbFlapFrameNames = (playerFrame: number) =>
	[0, 1, 2, 3].map((frame) => atlasFrame(BIRB_CHARACTERS[playerFrame % BIRB_CHARACTERS.length]!, frame))

export const birbFlapAnimKey = (playerFrame: number) => `flap_${playerFrame}`

export const birbFlapRepeatAnimKey = (playerFrame: number) => `flap_${playerFrame}_repeat`
