import { Devvit, useInterval, useWebView, type UseWebViewResult } from '@devvit/public-api'
Devvit.configure({
	redditAPI: true,
	redis: true,
})

import './app/blocks/addAppSettings'
import './app/blocks/addMenuItem'
import './app/jobs/dailyJob'
import './app/jobs/firstFlapperComment'
import './app/jobs/newHighscoreComment'
import './app/jobs/welcomeUser'
import './app/triggers/daily'

import { SplashScreen } from './app/SplashScreen'
import { RedisService } from './app/services/RedisService'
import { devvitLogger } from './shared/logger'
import type { PostMessageMessages, UpdateAppDataMessage } from './shared/messages'

Devvit.addCustomPostType({
	name: `Let's play Reddibirds!🐦`,
	height: 'regular',
	render: (context: Devvit.Context) => {
		// TODO: errrww ...
		const redisService = new RedisService(context)

		const tickUpdateAppData = async () => {
			const appData = await redisService.getAppData()
			postMessage({
				type: 'updateAppData',
				data: appData,
			} as UpdateAppDataMessage)
		}
		useInterval(tickUpdateAppData, 10000).start()

		const handleMessage = async (ev: PostMessageMessages, _hook: UseWebViewResult) => {
			switch (ev.type) {
				case 'saveStats': {
					const newScore = ev.data.personal.highscore
					let currentPersonalStats = await redisService.getCurrentPlayerStats()

					if (!currentPersonalStats) {
						currentPersonalStats = { highscore: 0, attempts: 0, rank: null }

						if (!context.userId) return
						try {
							const username = (await context.reddit.getUserById(context.userId))?.username
							if (!username) return
							context.scheduler.runJob({
								name: 'USER_WELCOME_JOB',
								data: {
									username,
									score: newScore,
								},
								runAt: new Date(),
							})
						} catch (e) {
							devvitLogger.error(`Error sending user welcome job. ${e}`)
						}
					}

					const isNewHighScore = newScore > currentPersonalStats.highscore
					await redisService.saveScore({
						highscore: isNewHighScore ? newScore : currentPersonalStats.highscore,
						score: newScore,
						isNewHighScore,
					})
					if (isNewHighScore) {
						context.ui.showToast({
							text: `Saved new personal Highscore ${newScore}!`,
							appearance: 'success',
						})
					}
					postMessage({
						type: 'gameOver',
						data: {
							isNewHighScore,
							newScore,
							highscore: isNewHighScore ? newScore : currentPersonalStats.highscore,
							attempts: currentPersonalStats.attempts + 1,
						},
					})
					break
				}

				case 'requestAppData': {
					const appData = await redisService.getAppData()
					postMessage({
						type: 'updateAppData',
						data: appData,
					} as UpdateAppDataMessage)

					break
				}

				default: {
					devvitLogger.info(`Unknown message type "${(ev as unknown as any).type}" !`)
				}
			}
		}
		const { mount, postMessage } = useWebView({
			url: 'index.html',
			onMessage: handleMessage,
			onUnmount: () => context.ui.showToast('Thanks for playing! See you soon!'),
		})

		return <SplashScreen context={context} onPress={mount} />
	},
})

export default Devvit
