/** Starting lives for new players. */
export const LIVES_START = 25

/** Free refill never pushes lives above this; purchased lives may exceed it. */
export const LIVES_FREE_CAP = 25

/** Lives restored each 6-hour window while below the free cap. */
export const LIVES_REFILL_AMOUNT = 5

/** Bonus lives granted the first time a player shares a new highscore on a daily. */
export const LIVES_SHARE_REWARD = 10

/** Milliseconds between free life refills. */
export const LIVES_REFILL_INTERVAL_MS = 6 * 60 * 60 * 1000

export const LIVES_PRODUCT_SKUS = ['birb-lives-25', 'birb-lives-75', 'birb-lives-225'] as const
export type LivesProductSku = (typeof LIVES_PRODUCT_SKUS)[number]

export type LivesProductOffer = {
	sku: LivesProductSku
	lives: number
	price: number
	label: string
}

export const LIVES_PRODUCT_OFFERS: LivesProductOffer[] = [
	{ sku: 'birb-lives-25', lives: 25, price: 50, label: '25 Lives' },
	{ sku: 'birb-lives-75', lives: 75, price: 100, label: '75 Lives' },
	{ sku: 'birb-lives-225', lives: 225, price: 250, label: '225 Lives' },
]

export const livesBySku = new Map<LivesProductSku, number>(
	LIVES_PRODUCT_OFFERS.map((offer) => [offer.sku, offer.lives] as const)
)

export const isLivesProductSku = (sku: string): sku is LivesProductSku => livesBySku.has(sku as LivesProductSku)
