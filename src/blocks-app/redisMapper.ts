import type { WorldSetting } from '../shared/messages'

export const mappAppSettingsToMessage = (settings: Record<'worldSelect' | 'playerSelect' | 'pipeSelect', string[]>) => {
	const { worldSelect, playerSelect, pipeSelect } = settings
	const mappedWorldSelect = !Array.isArray(worldSelect) || !worldSelect[0] ? 'sunset' : (worldSelect[0] as string)
	const mappedPlayerFrame = !Array.isArray(playerSelect) ? 0 : Number(playerSelect[0])
	const mappedPipeFrame = !Array.isArray(pipeSelect) ? 0 : Number(pipeSelect[0])

	return {
		world: mappedWorldSelect,
		playerFrame: mappedPlayerFrame,
		pipeFrame: mappedPipeFrame,
	} as WorldSetting
}
