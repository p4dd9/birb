import { serverLogger } from '@birb/shared';
import { context, settings } from '@devvit/web/server';
import type { PurchaseOrder } from './livesPurchaseService';

const getRedditcoreSpecs = async (): Promise<{ baseUrl: string; apiKey: string } | null> => {
	const [apiKey, apiBaseUrl, apiVersion] = await Promise.all([
		settings.get('api-key') as Promise<string | undefined>,
		settings.get('api-base-url') as Promise<string | undefined>,
		settings.get('api-version') as Promise<string | undefined>,
	])

	const missing = [
		!apiKey?.trim() ? 'api-key' : null,
		!apiBaseUrl?.trim() ? 'api-base-url' : null,
		!apiVersion?.trim() ? 'api-version' : null,
	].filter((key): key is string => key !== null)

	if (missing.length > 0) {
		serverLogger.warn(`No Redditcore specs found in settings: ${missing.join(', ')}`)
		return null
	}

	return { baseUrl: `${apiBaseUrl!.trim()}/api/v${apiVersion!.trim()}`, apiKey: apiKey!.trim() }
}

/** POST paid order + Reddit context to Redditcore for cross-app user/purchase analytics. */
export const trackPurchase = async (
	order: PurchaseOrder,
	metadata: Record<string, string> = {},
): Promise<unknown | null> => {
	try {
		const specs = await getRedditcoreSpecs()
		if (!specs) return null

		const body = JSON.stringify({
			...order,
			userid: context.userId ?? order.userId,
			username: context.username ?? order.username,
			subredditId: context.subredditId,
			metadata,
		})

		const res = await fetch(`${specs.baseUrl}/riddonkulous/purchase`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${specs.apiKey}`,
				'Content-Type': 'application/json',
			},
			body,
		})

		serverLogger.info(`Redditcore purchase tracked. ${body}`)
		serverLogger.info(`Redditcore purchase tracked. ${await res.json()}`)

		return await res.json()
	} catch (error) {
		serverLogger.error(`Error tracking purchase: ${error}`)
		return null
	}
}
