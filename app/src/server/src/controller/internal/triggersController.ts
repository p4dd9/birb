import { serverLogger } from '@birb/shared'
import { Router } from 'express'
import { createDailyPost } from '../../service/dailyService'

export const triggersController = Router()

// onAppInstall: make sure the community has today's daily post right away.
triggersController.post('/app-install', async (_req, res) => {
	try {
		serverLogger.info('Trigger: app-install — seeding first daily post')
		const result = await createDailyPost()
		res.status(200).json({ success: true, ...result })
	} catch (error) {
		serverLogger.error(`Trigger app-install failed: ${error}`)
		// Never fail the install over a post-creation hiccup.
		res.status(200).json({ success: false, error: String(error) })
	}
})
