/** Mulberry32 — fast, seedable 32-bit PRNG shared by client gameplay code. */
export class SeededRng {
	private state: number

	constructor(seed: number) {
		this.state = (seed >>> 0) || 1
	}

	/** Uniform float in [0, 1). */
	next = (): number => {
		let t = (this.state += 0x6d2b79f5)
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}

	between = (min: number, max: number): number => min + Math.floor(this.next() * (max - min + 1))

	floatBetween = (min: number, max: number): number => min + this.next() * (max - min)
}

/** Derive an independent RNG stream from the daily seed and integer salts. */
export const derivedRng = (seed: number, ...parts: number[]): SeededRng => {
	let h = seed >>> 0
	for (const part of parts) {
		h = Math.imul(h ^ (part >>> 0), 0x9e3779b1)
		h = (h << 13) | (h >>> 19)
		h >>>= 0
	}
	return new SeededRng(h)
}

/** Fisher–Yates shuffle using a seeded RNG (same seed → same order). */
export const shuffleWithRng = <T>(items: readonly T[], rng: SeededRng): T[] => {
	const copy = [...items]
	for (let i = copy.length - 1; i > 0; i--) {
		const j = rng.between(0, i)
		;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
	}
	return copy
}
