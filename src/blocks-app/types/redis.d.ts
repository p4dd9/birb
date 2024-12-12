export type SaveScoreData = {
	highscore: number
	score: number
	isNewHighScore: boolean
}

export type PlayerStats = {
	highscore: number
	attempts: number
}

export type CommunityStats = {
	communityScore: number
	communityAttempts: number
	topPlayer: string
}
