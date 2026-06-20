import { serverLogger } from '@birb/shared'
import { Router } from 'express'
import { createDailyPost } from '../../service/dailyService'
import { createLauncherPost } from '../../service/postService'
import { sweepExpiredMemberships } from '../../service/purchaseService'

export const menuController = Router()

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

// [ADMIN] Run Membership Flair Check — manual membership expiry sweep.
menuController.post('/membership-sweep', async (_req, res) => {
	try {
		const { checked, expired } = await sweepExpiredMemberships()
		res.status(200).json({ showToast: `Membership sweep: ${expired} expired of ${checked} checked.` })
	} catch (error) {
		serverLogger.error(`Menu membership-sweep failed: ${error}`)
		res.status(500).json({ showToast: `Membership sweep failed: ${error}` })
	}
})
