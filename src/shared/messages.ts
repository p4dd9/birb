export type PostMessageMessages =
	| SaveStatsMessage
	| GetBestPlayerMessage
	| GetBestPlayersMessage
	| ShareAsCommentMessage
export type SaveScoreData = {
	highscore: number
}

export type SaveStatsMessage = {
	type: 'saveStats'
	data: {
		personal: Pick<SaveScoreData, 'highscore'>
	}
}

export type GetBestPlayerMessage = {
	type: 'getBestPlayer'
	data: {}
}

export type GetBestPlayersMessage = {
	type: 'getBestPlayers'
	data: {}
}

export type ShareAsCommentMessage = {
	type: 'shareAsComment'
}

export type StartGameMessage = {
	type: 'startGame'
	data: {
		personal: SaveScoreData
	}
}

export type Player = {
	userId: string
	userName: string
	score: number
}
