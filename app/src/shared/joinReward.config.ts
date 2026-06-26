/**
 * Re-engagement "join & subscribe" reward: at escalating total-attempt
 * milestones the player is invited to follow + enable notifications in
 * exchange for a one-time pool of free lives.
 */

/** Total-attempt thresholds at which the join prompt is offered (ascending). */
export const JOIN_REWARD_ATTEMPT_TIERS = [25, 125, 500, 1000] as const

export type JoinRewardTier = (typeof JOIN_REWARD_ATTEMPT_TIERS)[number]

/** One-time lives granted when the player accepts the join prompt. */
export const JOIN_REWARD_LIVES = 100
