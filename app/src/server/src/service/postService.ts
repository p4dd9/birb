import { configFromSeed, pickLauncherPostTitle, postFlairStyleForFrame, serverLogger } from '@birb/shared'
import { context, reddit } from '@devvit/web/server'
import { getDailySeed, getLatestDailyNumber } from './dailyService'

/** Create the in-feed launcher post (menu + Play). */
export const createLauncherPost = async (): Promise<{ postId: string; url: string }> => {
	const dailyNumber = await getLatestDailyNumber()
	const seed = dailyNumber > 0 ? await getDailySeed(dailyNumber) : 0
	const config = configFromSeed(seed)
	const postData = {
		type: 'launcher' as const,
		...(dailyNumber > 0 ? { dailyNumber, seed, config } : { config }),
	}

	const post = await reddit.submitCustomPost({
		title: pickLauncherPostTitle(),
		entry: 'launcher',
		runAs: 'APP',
		postData,
	})

	await reddit.setPostData(post.id, postData)

	reddit
		.setPostFlair({
			postId: post.id,
			subredditName: context.subredditName,
			text: 'Launcher',
			...postFlairStyleForFrame(config.pipeFrame),
		})
		.catch((e) => serverLogger.error(`Failed setting launcher post flair: ${e}`))

	serverLogger.info(`Created launcher post: ${post.id}`)
	return { postId: post.id, url: post.url }
}
