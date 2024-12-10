export type PostMessageMessages = SaveStatsMessage | GetBestPlayersMessage | RequestSettingsMessage
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

export type RequestSettingsMessage = {
	type: 'requestAppSettings'
}

export type WorldSetting = {
	world: string
	playerFrame: number
	pipeFrame: number
}

export type UpdateGameSettingMessage = {
	type: 'changeWorld'
	data: WorldSetting
}

export type UpdateOnlinePlayersMessage = {
	type: 'updateOnlinePlayers'
	data: { count: number }
}

export type Player = {
	userId: string
	userName: string
	score: number
}
