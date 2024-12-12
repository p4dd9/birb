import { RANKS } from '../config/ranks.config'

export type RankInfo = {
	currentRank: string
	gamesToNextRank: number | null
	nextRank: string | null
}

export const getRank = (gamesPlayed: number) => {
	let currentRank = RANKS[0]!.name
	let nextRank: string | null = null
	let gamesToNextRank: number | null = null

	for (let i = 0; i < RANKS.length; i++) {
		if (gamesPlayed >= RANKS[i]!.threshold) {
			currentRank = RANKS[i]!.name
			if (i + 1 < RANKS.length) {
				nextRank = RANKS[i + 1]!.name
				gamesToNextRank = RANKS[i + 1]!.threshold - gamesPlayed
			} else {
				nextRank = null
				gamesToNextRank = null
			}
		}
	}

	return {
		currentRank,
		gamesToNextRank,
		nextRank,
	}
}
