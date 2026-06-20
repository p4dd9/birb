class Logger {
	context: string

	constructor(context = '') {
		this.context = context ? `[${context}] ` : ''
	}

	private log(level: 'info' | 'warn' | 'error', message: string, meta?: unknown) {
		const timestamp = new Date().toISOString()
		const suffix = meta === undefined ? '' : ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`
		const formattedMessage = `${timestamp} [${level.toUpperCase()}] ${this.context}${message}${suffix}`

		if (level === 'error') {
			console.error(formattedMessage)
		} else if (level === 'warn') {
			console.warn(formattedMessage)
		} else {
			console.log(formattedMessage)
		}
	}

	info(message: string | number | boolean, meta?: unknown) {
		this.log('info', String(message), meta)
	}

	warn(message: string | number | boolean, meta?: unknown) {
		this.log('warn', String(message), meta)
	}

	error(message: string | number | boolean, meta?: unknown) {
		this.log('error', String(message), meta)
	}
}

/** Server-side (Express / Devvit server) logger. */
export const serverLogger = new Logger('Server')
/** Client-side (web view / Phaser) logger. */
export const clientLogger = new Logger('Client')
