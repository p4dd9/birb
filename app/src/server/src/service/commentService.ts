import { context, reddit } from '@devvit/web/server'

/** Post the player's share comment on the current post thread. */
export const shareScoreComment = async (comment: string, score: number) => {
	const postId = context.postId
	if (!postId) {
		throw new Error('Missing postId')
	}

	const trimmed = comment.trim()
	if (!trimmed) {
		throw new Error('Comment is required')
	}

	const text = `${trimmed}\n\nHighscore: ${score}`

	await reddit.submitComment({
		id: postId,
		text,
		runAs: 'USER',
	})
}
