import { pipeThemeForFrame } from '@birb/shared'

export const applyShellTheme = (pipeFrame: number): void => {
	const { shellLight, shellDark, frameAsset } = pipeThemeForFrame(pipeFrame)
	const frameUrl = `url('/assets/pipes/${frameAsset}')`

	const shell = document.getElementById('game-shell')
	shell?.style.setProperty('--shell-light', shellLight)
	shell?.style.setProperty('--shell-dark', shellDark)

	const frame = document.getElementById('game-frame')
	frame?.style.setProperty('--pipe-frame-url', frameUrl)

	frame?.querySelectorAll<HTMLElement>('.pipe-frame-edge').forEach((edge) => {
		edge.style.backgroundImage = frameUrl
	})
}

export const changeBackgroundStyle = (backgroundName: string) => {
	const canvasParent = document.querySelector('#game-container > canvas')
	if (canvasParent && canvasParent instanceof HTMLCanvasElement) {
		canvasParent.style.background = `url('/assets/bg/${backgroundName}.png') center / auto 100% repeat-x`
	}
}
