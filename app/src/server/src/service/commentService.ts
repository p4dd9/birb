import { serverLogger } from '@birb/shared'
import { reddit } from '@devvit/web/server'

/** Welcome DM on a player's very first run. */
export const sendWelcomeMessage = async (username: string, score: number) => {
	try {
		await reddit.sendPrivateMessage({
			to: username,
			subject: `Welcome to Birb!`,
			text: `🎉 **You scored ${score} on your first Birb run!** 🎉`,
		})
	} catch (error) {
		serverLogger.error(`Failed USER_WELCOME message for ${username}: ${error}`)
	}
}
