export const changeBackgroundStyle = (backgroundName: string) => {
	const canvasParent = document.querySelector('#game-container > canvas')
	if (canvasParent && canvasParent instanceof HTMLCanvasElement) {
		canvasParent.style.background = `url('/assets/bg/${backgroundName}.png') center / auto 100% repeat-x`
	}
}
