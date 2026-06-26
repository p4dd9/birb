import { serverLogger } from '@birb/shared'
import { context } from '@devvit/web/server'
import type { NextFunction, Request, Response } from 'express'

/**
 * Rejects the request with 401 when `context.userId`/`context.username` is
 * missing. Inside guarded handlers read identity directly from
 * `context.userId!` / `context.username!`.
 */
export const requireAuth = (_req: Request, res: Response, next: NextFunction): void => {
	if (!context.userId || !context.username) {
		serverLogger.error(`Not authenticated: userId=${context.userId}, username=${context.username}`)
		res.status(401).json({ error: 'Not authenticated' })
		return
	}
	next()
}
