import { serverLogger } from '@birb/shared'
import { createServer, getServerPort } from '@devvit/server'
import express from 'express'
import { appController } from './controller/appController'
import { internalController } from './controller/internal/internalController'
import { scoreController } from './controller/scoreController'

const app = express()

app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(express.text({ limit: '10mb' }))
app.use(express.json({ limit: '10mb' }))

// Devvit-internal endpoints (scheduler, triggers, payments, menu actions).
app.use('/internal', internalController)

// Public game API.
app.use('/api/v1/app', appController)
app.use('/api/v1/score', scoreController)

const server = createServer(app)
server.listen(getServerPort(), () => {
	serverLogger.info(`Birb server running on port ${getServerPort()}`)
})

export default app
