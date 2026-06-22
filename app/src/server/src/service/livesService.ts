import {
	LIVES_FREE_CAP,
	LIVES_REFILL_AMOUNT,
	LIVES_REFILL_INTERVAL_MS,
	LIVES_START,
	type LivesData,
	serverLogger,
} from '@birb/shared'
import { playerLivesKey } from '@birb/shared/keys'
import { reddit, redis } from '@devvit/web/server'

type LivesHash = {
	count?: string
	lastRefillAt?: string
}

const parseCount = (raw: string | undefined): number => {
	const n = Number(raw)
	return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : LIVES_START
}

const parseLastRefillAt = (raw: string | undefined, fallback: number): number => {
	const n = Number(raw)
	return Number.isFinite(n) && n > 0 ? n : fallback
}

const buildLivesData = (count: number, lastRefillAt: number): LivesData => ({
	count,
	nextRefillAt: count >= LIVES_FREE_CAP ? null : lastRefillAt + LIVES_REFILL_INTERVAL_MS,
	freeCap: LIVES_FREE_CAP,
})

/** Apply elapsed 6h windows; advances the anchor by whole intervals only. */
const applyFreeRefills = (count: number, lastRefillAt: number, now: number): { count: number; lastRefillAt: number } => {
	const intervals = Math.floor((now - lastRefillAt) / LIVES_REFILL_INTERVAL_MS)
	if (intervals <= 0) return { count, lastRefillAt }

	const room = Math.max(0, LIVES_FREE_CAP - count)
	const gain = Math.min(intervals * LIVES_REFILL_AMOUNT, room)
	if (gain <= 0) {
		return { count, lastRefillAt: lastRefillAt + intervals * LIVES_REFILL_INTERVAL_MS }
	}

	return {
		count: count + gain,
		lastRefillAt: lastRefillAt + intervals * LIVES_REFILL_INTERVAL_MS,
	}
}

const readLivesHash = async (userId: string): Promise<LivesHash> =>
	(await redis.hGetAll(playerLivesKey(userId))) as LivesHash

const writeLivesHash = async (userId: string, count: number, lastRefillAt: number): Promise<void> => {
	await redis.hSet(playerLivesKey(userId), {
		count: String(count),
		lastRefillAt: String(lastRefillAt),
	})
}

/** Load lives, initializing new players and applying any due free refills. */
export const syncPlayerLives = async (userId: string): Promise<LivesData> => {
	const now = Date.now()
	const stored = await readLivesHash(userId)

	if (!stored.count) {
		await writeLivesHash(userId, LIVES_START, now)
		return buildLivesData(LIVES_START, now)
	}

	let count = parseCount(stored.count)
	let lastRefillAt = parseLastRefillAt(stored.lastRefillAt, now)
	const refilled = applyFreeRefills(count, lastRefillAt, now)

	if (refilled.count !== count || refilled.lastRefillAt !== lastRefillAt) {
		count = refilled.count
		lastRefillAt = refilled.lastRefillAt
		await writeLivesHash(userId, count, lastRefillAt)
	}

	return buildLivesData(count, lastRefillAt)
}

/** Decrement by one after a finished run; never below zero. */
export const consumePlayerLife = async (userId: string): Promise<LivesData> => {
	const synced = await syncPlayerLives(userId)
	if (synced.count <= 0) return synced

	const nextCount = synced.count - 1
	const stored = await readLivesHash(userId)
	const lastRefillAt = parseLastRefillAt(stored.lastRefillAt, Date.now())
	await writeLivesHash(userId, nextCount, lastRefillAt)
	return buildLivesData(nextCount, lastRefillAt)
}

/** Grant purchased or admin-granted lives (no free cap). */
export const addPlayerLives = async (userId: string, amount: number): Promise<LivesData> => {
	if (amount <= 0) return syncPlayerLives(userId)

	const synced = await syncPlayerLives(userId)
	const stored = await readLivesHash(userId)
	const lastRefillAt = parseLastRefillAt(stored.lastRefillAt, Date.now())
	const nextCount = synced.count + Math.floor(amount)
	await writeLivesHash(userId, nextCount, lastRefillAt)
	return buildLivesData(nextCount, lastRefillAt)
}

/** Remove lives for admin tools; never below zero. */
export const removePlayerLives = async (userId: string, amount: number): Promise<LivesData> => {
	if (amount <= 0) return syncPlayerLives(userId)

	const synced = await syncPlayerLives(userId)
	const stored = await readLivesHash(userId)
	const lastRefillAt = parseLastRefillAt(stored.lastRefillAt, Date.now())
	const nextCount = Math.max(0, synced.count - Math.floor(amount))
	await writeLivesHash(userId, nextCount, lastRefillAt)
	return buildLivesData(nextCount, lastRefillAt)
}

export const resolveUserIdByUsername = async (
	rawUsername: unknown
): Promise<{ userId: string; username: string } | { error: string }> => {
	const username = typeof rawUsername === 'string' ? rawUsername.trim().replace(/^u\//i, '') : ''
	if (!username) return { error: 'Username is required' }

	try {
		const user = await reddit.getUserByUsername(username)
		if (!user?.id) return { error: `User not found: ${username}` }
		return { userId: user.id, username: user.username }
	} catch (error) {
		serverLogger.error(`Failed to resolve username ${username}: ${error}`)
		return { error: `User not found: ${username}` }
	}
}

export const logPlayerLives = async (userId: string, username: string): Promise<LivesData> => {
	const lives = await syncPlayerLives(userId)
	serverLogger.info(
		`[ADMIN LIVES] ${username} (${userId}): count=${lives.count}, nextRefillAt=${lives.nextRefillAt ?? 'n/a'}`
	)
	return lives
}

export const manageLivesFormDefinition = {
	title: 'Manage Player Lives',
	description: 'View, add, or remove lives for a player.',
	fields: [
		{
			type: 'string',
			name: 'username',
			label: 'Reddit username',
			required: true,
		},
		{
			type: 'select',
			name: 'action',
			label: 'Action',
			required: true,
			defaultValue: ['view'],
			options: [
				{ label: 'View (log to server)', value: 'view' },
				{ label: 'Add lives', value: 'add' },
				{ label: 'Remove lives', value: 'remove' },
			],
		},
		{
			type: 'number',
			name: 'amount',
			label: 'Amount (add/remove only)',
			required: false,
		},
	],
	acceptLabel: 'Apply',
} as const
