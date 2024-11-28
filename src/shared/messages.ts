export type SaveStatsMessage = {
	type: 'saveStats'
	data: {
		wins: number
		losses: number
	}
}

export type StartGameMessage = {
	type: 'startGame'
	data: {
		wins: number
		losses: number
	}
}
