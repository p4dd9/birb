import { serverLogger } from '@birb/shared'
import { Router } from 'express'
import { createDailyPost } from '../../service/dailyService'

export const schedulerController = Router()

// Cron (daily 00:00 UTC): generate today's seed + post the daily level.
schedulerController.post('/daily-level', async (_req, res) => {
	try {
		serverLogger.info('Scheduler: daily-level started')
		const result = await createDailyPost()
		res.status(200).json({ success: true, ...result })
	} catch (error) {
		serverLogger.error('Scheduler: daily-level failed', { error: String(error) })
		res.status(500).json({ error: String(error) })
	}
})
