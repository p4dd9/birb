export const changeBackgroundStyle = (backgroundName: string) => {
	const canvasParent = document.getElementById('game-container')
	if (canvasParent && canvasParent instanceof HTMLDivElement) {
		// BUG/WEIRD: unreliable pixel dimension on window and body element in webviews, most likely as there are some resizing events fired (idk rly)
		// ISSUE not showing repeating bg: body.style.background = `url('/assets/bg/${worldSetting.world}.png') 0% 0% / auto 320px repeat-x`
		//
		// these values evaluate to random numbers at some point, 0px in height,
		// addDebugMsg(`innerHeight: ${window.innerHeight}px`)
		// addDebugMsg(`innerWidth: ${window.innerWidth}px`)

		// WORKAROUND: create a new canvas parent or use the canvas directly, centered and set the fixed height based on dimension (regular vs tall)
		canvasParent.style.background = `url('/assets/bg/${backgroundName}.png') center / auto 320px repeat-x`
	}
}
