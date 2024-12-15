export const DAILY_KEY = 'current_challenge'
export const USER_COMPLETION_PREFIX = 'user_completion_'

export const DAILY_TTL = 24 * 60 * 60

export interface Challenge {
	title: string
	description: string
	reward: string
	points: number
}

export const DAILY: Challenge = {
	title: `Daily Quest`,
	description: 'Beat your highscore',
	reward: '50 community points!',
	points: 50,
}
