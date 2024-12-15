export class FPSDebugger {
	scene: Phaser.Scene
	text: Phaser.GameObjects.Text
	deltaTime = '0'
	fpsFromDelta = '0'
	actualFps = '0'
	targetFps = '0'

	constructor(scene: Phaser.Scene, x = 10, y = 500) {
		this.scene = scene
		this.text = scene.add
			.text(x, y, '', {
				fontSize: 32,
				color: 'white',
				backgroundColor: 'black',
				padding: { left: 10, right: 10, top: 5, bottom: 5 },
			})
			.setDepth(1000)

		this.updateStats()
	}

	updateStats() {
		const loop = this.scene.sys.game.loop

		const delta = loop.delta

		this.deltaTime = delta.toFixed(2) // time per frame shown
		this.actualFps = loop.actualFps.toFixed(1) // actual fps of display
		this.targetFps = loop.targetFps.toString() // target fps by gameconfig

		const fpsFromDeltaMsValue = delta > 0 ? (1000 / delta).toFixed(1) : 'N/A'
		this.fpsFromDelta = fpsFromDeltaMsValue // frames calculcated by delta respectively

		this.text.setText(
			`Actual FPS: ${this.actualFps}\n` +
				`FPS (from Delta): ${this.fpsFromDelta}\n` +
				`Target FPS: ${this.targetFps}\n` +
				`Delta: ${this.deltaTime} ms`
		)

		this.scene.time.delayedCall(50, () => this.updateStats())
	}
}
