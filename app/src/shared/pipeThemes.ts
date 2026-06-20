/**
 * Per-frame pipe cosmetics — frame index matches `pipes.png` (4×2 grid, row-major)
 * and legacy `pipeSelect` settings (0 green … 7 orange/rust).
 * Shell colors sampled from each pipe sprite body (highlight + main tone).
 */
export type PipeTheme = {
	shellLight: string
	shellDark: string
	/** Filename under client `/assets/pipes/`. */
	frameAsset: string
}

export const PIPE_THEMES: readonly PipeTheme[] = [
	{ shellLight: '#98e858', shellDark: '#58c848', frameAsset: 'pipe-green.png' },
	{ shellLight: '#f8c828', shellDark: '#f8a818', frameAsset: 'pipe-orange.png' },
	{ shellLight: '#f85858', shellDark: '#e83838', frameAsset: 'pipe-red.png' },
	{ shellLight: '#98f8f8', shellDark: '#08c8f8', frameAsset: 'pipe-blue.png' },
	{ shellLight: '#f8f8e8', shellDark: '#b8c8c8', frameAsset: 'pipe-gray.png' },
	{ shellLight: '#f888a8', shellDark: '#c83898', frameAsset: 'pipe-purple.png' },
	{ shellLight: '#c86848', shellDark: '#783828', frameAsset: 'pipe-brown.png' },
	{ shellLight: '#f88838', shellDark: '#d84818', frameAsset: 'pipes-7.png' },
] as const

export const pipeThemeForFrame = (pipeFrame: number): PipeTheme =>
	PIPE_THEMES[((pipeFrame % PIPE_THEMES.length) + PIPE_THEMES.length) % PIPE_THEMES.length]!
