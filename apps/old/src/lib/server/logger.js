import pino from 'pino';
import { dev } from '$app/environment';

export const logger = pino({
	level: (process.env.LOGGING_LEVEL ?? dev) ? 'debug' : 'info',
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
		},
	},
});
