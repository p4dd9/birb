export type PostMessageMessages = SaveStatsMessage | GetBestPlayersMessage | RequestAppData
export type SaveScoreData = {
	highscore: number
}

export type SaveStatsMessage = {
	type: 'saveStats'
	data: {
		personal: Pick<SaveScoreData, 'highscore'>
	}
}

export type GetBestPlayersMessage = {
	type: 'getBestPlayers'
	data: {}
}

export type StartGameMessage = {
	type: 'startGame'
	data: {
		personal: SaveScoreData
	}
}

export type RequestAppData = {
	type: 'requestAppData'
}

export type AppConfiguration = {
	world: string
	playerFrame: number
	pipeFrame: number
}

export type AppData = {
	config: AppConfiguration
}

export type UpdateAppDataMessage = {
	type: 'updateAppData'
	data: AppData
}

export type UpdateOnlinePlayersMessage = {
	type: 'updateOnlinePlayers'
	data: { count: number }
}

export type RedisPlayer = {
	userId: string
	userName: string
	score: number
	attempts: number
}
