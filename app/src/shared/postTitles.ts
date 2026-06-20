/** Title pool for the in-feed Launcher post; one is picked at random per post. */
export const LAUNCHER_POST_TITLES: readonly string[] = [
	'Bird up with Birb! 🐦',
	'Play Birb in the feed! 🐦',
	'How far can you Birb? 🐦',
	'Your flock of one needs you! 🐦',
	'Ready to flap? 🐦',
	'The pipes are waiting! 🐦',
	'Got a minute to Birb? ✨',
	'Can you beat today’s daily? 🐦',
	'Another day, another flap! 🐦',
	'What’s your Birb goal for today? 🐦',
	'Don’t miss the daily run! 🐦',
	'Have you checked the leaderboard today? 🐦',
	'One more try? 🐦',
	'Ready for the adventure? 🐦',
	'How high can you score today? 🏆',
] as const

/**
 * Suffix pool for daily posts — full title is `#${n} Daily Birb — ${suffix}`.
 * One suffix is picked at random when the post is created.
 */
export const DAILY_POST_TITLE_SUFFIXES: readonly string[] = [
	'Ready to flap? 🐦',
	'How far can you go today? 🐦',
	'Same seed, new runs! 🐦',
	'Can you top the leaderboard? 🏆',
	"Today's level is waiting! 🐦",
	'One more try? 🐦',
	"Don't hit the pipes! 🐦",
	'Beat your high score today! 🏆',
	'Spread your wings! 🐦',
	'Tap to fly! 🐦',
	'Another day, another flap! 🐦',
	"Can you survive today's twists? 🐦",
	'Claim the top spot! 🏆',
	'Your daily flight awaits! 🐦',
	'The pipes won’t dodge themselves! 🐦',
	'How high can you score? 🏆',
	"Ready for today's challenge? 🐦",
	'The birb is calling! 🐦',
	'New pipes, who dis? 🐦',
	'Flap first, think later! 🐦',
	'Got a minute to Birb? ✨',
	'Who’s #1 today? 🏆',
	'Clear the gap today! 🐦',
	'Could rain be coming? 🌧️',
	'Ready to dodge invisible pipes? 👻',
	'Did you try the daily yet? 🐦',
	'Just one more run… 🐦',
	'The sky is the limit! 🐦',
	'Prove you’re the top birb! 🏆',
] as const

const pickRandom = (pool: readonly string[]): string => pool[Math.floor(Math.random() * pool.length)]!

export const pickLauncherPostTitle = (): string => pickRandom(LAUNCHER_POST_TITLES)

/** e.g. `#12 Daily Birb — Ready to flap? 🐦` */
export const formatDailyPostTitle = (dailyNumber: number): string =>
	`#${dailyNumber} Daily Birb — ${pickRandom(DAILY_POST_TITLE_SUFFIXES)}`

/** Match daily posts by number prefix (titles vary after `Daily Birb`). */
export const matchesDailyPostTitle = (title: string, dailyNumber: number): boolean =>
	title.startsWith(`#${dailyNumber} Daily`)
