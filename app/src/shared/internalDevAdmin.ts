/** Hammertime dev account — sole user allowed to run internal admin tools. */
export const INTERNAL_DEV_ADMIN_USER_ID = 't2_j0ifwpm4v'

export const isInternalDevAdminUserId = (userId: string | null | undefined): boolean =>
	Boolean(userId && userId === INTERNAL_DEV_ADMIN_USER_ID)
