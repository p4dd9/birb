import type { AppData } from '@birb/shared'

type AppDataListener = (appData: AppData) => void
type StartGameListener = () => void

/** Lightweight pub/sub replacing the old postMessage event bridge. */
class BirbBridge {
	private appData: AppData | null = null
	private appDataListeners = new Set<AppDataListener>()
	private startGameListeners = new Set<StartGameListener>()

	getAppData = (): AppData | null => this.appData

	setAppData = (appData: AppData): void => {
		this.appData = appData
		for (const listener of this.appDataListeners) listener(appData)
	}

	onAppData = (listener: AppDataListener): (() => void) => {
		this.appDataListeners.add(listener)
		return () => this.appDataListeners.delete(listener)
	}

	offAppData = (listener: AppDataListener): void => {
		this.appDataListeners.delete(listener)
	}

	emitStartGame = (): void => {
		for (const listener of this.startGameListeners) listener()
	}

	onceStartGame = (listener: StartGameListener): (() => void) => {
		this.startGameListeners.add(listener)
		return () => this.startGameListeners.delete(listener)
	}
}

export const birbBridge = new BirbBridge()
