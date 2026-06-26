/** Shared top/side inset for the lives counter and mute toggle row. */
export const HUD_EDGE = 10

/** Matches heart + HUD sprite scale (16px source art). */
export const HUD_SPRITE_SCALE = 3

/** Heart atlas source cell size. */
export const HUD_HEART_SRC_W = 17
export const HUD_HEART_SRC_H = 16

/** On-screen heart / HUD icon box (17×16 at ×3). */
export const HUD_HEART_DISPLAY_W = HUD_HEART_SRC_W * HUD_SPRITE_SCALE
export const HUD_SPRITE_H = HUD_HEART_SRC_H * HUD_SPRITE_SCALE

/** Sound icon atlas source cell size. */
export const HUD_SOUND_SRC_W = 16
export const HUD_SOUND_SRC_H = 16

/** Scale sound icon to the HUD row height as hearts (16→48), trimmed 10% smaller. */
export const HUD_SOUND_SCALE = (HUD_SPRITE_H / HUD_SOUND_SRC_H) * 0.9

/** On-screen sound icon (16×16 at ×3). */
export const HUD_SOUND_DISPLAY_W = HUD_SOUND_SRC_W * HUD_SOUND_SCALE
export const HUD_SOUND_DISPLAY_H = HUD_SOUND_SRC_H * HUD_SOUND_SCALE

/** Vertical center of HUD sprites, inset equally from the top edge. */
export const HUD_ROW_CENTER_Y = HUD_EDGE + HUD_SPRITE_H / 2
