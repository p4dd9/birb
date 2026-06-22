import { serverLogger } from '@birb/shared'
import { Router } from 'express'
import { createDailyPost } from '../../service/dailyService'
import {
	addPlayerLives,
	logPlayerLives,
	manageLivesFormDefinition,
	removePlayerLives,
	resolveUserIdByUsername,
} from '../../service/livesService'
import { createLauncherPost } from '../../service/postService'
import { requireAuthAdmin } from '../../middleware/requireAuthAdmin'

export const menuController = Router()

const adminToast = (text: string, appearance: 'success' | 'neutral' = 'neutral') => ({
	showToast: { text, appearance },
})

const parseAmount = (raw: unknown): number | null => {
	const n = Number(raw)
	if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) return null
	return n
}

/** Devvit select fields submit as string[]; menu form defaults may use a plain string. */
const parseSelectValue = (raw: unknown): string => {
	if (typeof raw === 'string') return raw
	if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0]
	return ''
}

// [ADMIN] Create Launcher Post — in-feed menu + Play button.
menuController.post('/create-launcher', async (_req, res) => {
	try {
		const { url } = await createLauncherPost()
		res.status(200).json({ navigateTo: url })
	} catch (error) {
		serverLogger.error(`Menu create-launcher failed: ${error}`)
		res.status(500).json({ showToast: `Failed to create launcher post: ${error}` })
	}
})

// [ADMIN] Create Daily Birb Post — manual trigger of the daily-level service.
menuController.post('/create-daily', async (_req, res) => {
	try {
		const { url } = await createDailyPost()
		res.status(200).json({ navigateTo: url })
	} catch (error) {
		serverLogger.error(`Menu create-daily failed: ${error}`)
		res.status(500).json({ showToast: `Failed to create daily post: ${error}` })
	}
})

// [ADMIN] Manage player lives — hammertime dev only.
menuController.post('/manage-lives', requireAuthAdmin, (_req, res) => {
	res.status(200).json({
		showForm: {
			name: 'manageLivesForm',
			form: manageLivesFormDefinition,
			data: { action: ['view'], amount: 5 },
		},
	})
})

menuController.post('/manage-lives-submit', requireAuthAdmin, async (req, res) => {
	const resolved = await resolveUserIdByUsername(req.body?.username)
	if ('error' in resolved) {
		res.status(200).json(adminToast(resolved.error))
		return
	}

	const action = parseSelectValue(req.body?.action)
	const { userId, username } = resolved

	try {
		if (action === 'view') {
			const lives = await logPlayerLives(userId, username)
			res.status(200).json(
				adminToast(`${username}: ${lives.count} lives${lives.nextRefillAt ? ` (refill ${new Date(lives.nextRefillAt).toLocaleTimeString()})` : ''}`, 'success')
			)
			return
		}

		const amount = parseAmount(req.body?.amount)
		if (!amount) {
			res.status(200).json(adminToast('Amount must be a positive integer'))
			return
		}

		if (action === 'add') {
			const lives = await addPlayerLives(userId, amount)
			serverLogger.info(`[ADMIN LIVES] Added ${amount} to ${username}; now ${lives.count}`)
			res.status(200).json(adminToast(`Added ${amount} lives to ${username} (now ${lives.count})`, 'success'))
			return
		}

		if (action === 'remove') {
			const lives = await removePlayerLives(userId, amount)
			serverLogger.info(`[ADMIN LIVES] Removed ${amount} from ${username}; now ${lives.count}`)
			res.status(200).json(adminToast(`Removed ${amount} lives from ${username} (now ${lives.count})`, 'success'))
			return
		}

		res.status(200).json(adminToast('Invalid action'))
	} catch (error) {
		serverLogger.error(`Menu manage-lives failed: ${error}`)
		res.status(200).json(adminToast('Manage lives failed. Check server logs.'))
	}
})
