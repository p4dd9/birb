import { Devvit, useState, type Context } from '@devvit/public-api'
import { devvitLogger } from '../shared/logger'

export const SplashScreen = (props: SplashScreenProps, context: Context) => {
	const { onPress } = props

	const [showSubscribedBtn, setShowSubscribedBtn] = useState(async () => {
		if (!context.userId) {
			return false
		}
		try {
			const isSubscribed = await context.redis.get(`subscribed:${context.userId}`)
			if (isSubscribed !== 'true') {
				return true
			}
			return false
		} catch (error) {
			devvitLogger.error(`Error getting subscription status: ${error}`)
			return false
		}
	})

	const onSubscribePress = async () => {
		if (!context.userId) {
			return
		}

		try {
			await context.redis.set(`subscribed:${context.userId}`, 'true')
			setShowSubscribedBtn(false)
			context.ui.showToast('You are now subscribed!')
		} catch (error) {
			context.ui.showToast('Failed to subscribe. Please try again or refresh the Post.')
			devvitLogger.error(`'Failed to subscribe. Please try again or refresh the Post`)
			return
		}
	}

	return (
		<zstack grow height="100%" width="100%" alignment="middle center">
			<zstack>
				<image
					url="splash-background-4.gif"
					height="100%"
					width="100%"
					imageWidth={`${context.dimensions?.width ?? 670}px`}
					imageHeight={`${context.dimensions?.height ?? 320}px`}
					resizeMode="cover"
				/>
			</zstack>
			<zstack>
				<vstack gap="small">
					<button icon="play-fill" appearance="secondary" size="large" onPress={onPress}>
						PLAY GAME
					</button>

					{showSubscribedBtn && (
						<button icon="join" appearance="primary" size="medium" onPress={onSubscribePress}>
							Subscribe
						</button>
					)}
				</vstack>
			</zstack>
		</zstack>
	)
}

type SplashScreenProps = {
	context: Devvit.Context
	onPress: () => void
}
