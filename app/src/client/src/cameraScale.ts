/** World width — always the fixed internal resolution (Scale.FIT handles display). */
export const layoutWidth = (scene: Phaser.Scene): number => scene.scale.width

/** World height — always the fixed internal resolution (Scale.FIT handles display). */
export const layoutHeight = (scene: Phaser.Scene): number => scene.scale.height

const readContainerSize = (container: HTMLElement): { width: number; height: number } => {
	// visualViewport is more reliable than clientWidth on iOS Safari / in-app browsers.
	const vv = window.visualViewport
	if (vv && vv.width > 0 && vv.height > 0) {
		return { width: Math.round(vv.width), height: Math.round(vv.height) }
	}
	return { width: container.clientWidth, height: container.clientHeight }
}

/** Boot once the embed container has dimensions; FIT mode scales the canvas from there. */
export const bootPhaserGame = (config: Phaser.Types.Core.GameConfig): Promise<Phaser.Game> =>
	new Promise((resolve) => {
		const container = document.getElementById('game-container')
		if (!container) {
			throw new Error('Missing #game-container')
		}

		const stage = document.getElementById('game-stage')

		let game: Phaser.Game | null = null
		let bootObserver: ResizeObserver | null = null

		const refresh = (): void => {
			const { width, height } = readContainerSize(container)
			if (width <= 0 || height <= 0) return

			if (game) {
				game.scale.refresh()
				return
			}

			bootObserver?.disconnect()
			bootObserver = null

			game = new Phaser.Game(config)
			resolve(game)
		}

		const onLayoutChange = (): void => refresh()

		requestAnimationFrame(refresh)

		bootObserver = new ResizeObserver(onLayoutChange)
		if (stage) bootObserver.observe(stage)
		bootObserver.observe(container)
		window.addEventListener('resize', onLayoutChange)
		window.visualViewport?.addEventListener('resize', onLayoutChange)
		window.visualViewport?.addEventListener('scroll', onLayoutChange)
	})

/** @deprecated Fixed-resolution FIT mode — no per-scene camera zoom needed. */
export const bindSceneCameraScale = (_scene: Phaser.Scene): void => {}
