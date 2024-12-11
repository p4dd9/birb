import { createLogger, format, transports } from 'winston'

const logFormat = format.printf(({ timestamp, level, message }) => {
	return `${timestamp} [${level}]: ${message}`
})

export const logger = createLogger({
	level: 'info',
	format: format.combine(format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), format.colorize(), logFormat),
	transports: [new transports.Console()],
})
