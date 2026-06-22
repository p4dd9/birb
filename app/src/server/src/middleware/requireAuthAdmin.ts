import { isInternalDevAdminUserId } from '@birb/shared'
import { context } from '@devvit/web/server'
import type { NextFunction, Request, Response } from 'express'

export { INTERNAL_DEV_ADMIN_USER_ID, isInternalDevAdminUserId } from '@birb/shared'

export const requireAuthAdmin = (_req: Request, res: Response, next: NextFunction): void => {
	if (!isInternalDevAdminUserId(context.userId)) {
		res.status(403).json({ error: 'Forbidden' })
		return
	}
	next()
}
