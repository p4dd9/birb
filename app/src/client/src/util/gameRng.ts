import { derivedRng } from '@birb/shared'

/** RNG stream scoped to a pipe row — same seed + pipe index → same spawns/effects. */
export const pipeRng = (seed: number, pipeNumber: number, salt = 0) => derivedRng(seed, pipeNumber, salt)
