import * as Sentry from '@sentry/browser'
import { ReddiBirdsGame } from './game'
import { gameConfig } from './game.config'
import { PostMessageEventManager } from './web/PostMessageEventManager'

Sentry.init({
	dsn: 'https://4d4c0efb408ed8a4bf5f9e3262d4f621@o4508416738131968.ingest.de.sentry.io/4508416739967056',
	integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
	// Tracing
	tracesSampleRate: 1.0, //  Capture 100% of the transactions
	// Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
	tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
	// Session Replay
	replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
	replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
})

// @ts-expect-error
myUndefinedFunction()
PostMessageEventManager.registerEvents()

const game = new ReddiBirdsGame(gameConfig)
game.scene.start('Boot', { ...gameConfig })
