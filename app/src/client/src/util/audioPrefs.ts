const MUTE_PREF_KEY = 'birb:muted'

/** Game-level event broadcast whenever the mute pref changes, so all HUD mute toggles stay in sync. */
export const AUDIO_MUTE_EVENT = 'birb:audio-muted'

/** First-time players start muted; returns persisted preference after that. */
export const loadMutedPref = (): boolean => {
	try {
		const stored = localStorage.getItem(MUTE_PREF_KEY)
		if (stored === null) return true
		return stored === 'true'
	} catch {
		return true
	}
}

export const saveMutedPref = (muted: boolean): void => {
	try {
		localStorage.setItem(MUTE_PREF_KEY, String(muted))
	} catch {
		// localStorage may be unavailable in some embed contexts
	}
}

export const applyMuteToGame = (game: Phaser.Game, muted: boolean): void => {
	game.sound.mute = muted
}
