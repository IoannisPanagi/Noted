import { LogLevel } from '@nestjs/common';

// What LOG_LEVEL accepts. 'info' is Nest's 'log', kept under the name the rest
// of the world (and the old pino setup) uses.
export const LOG_LEVEL_NAMES = [
	'silent',
	'fatal',
	'error',
	'warn',
	'info',
	'debug',
	'verbose',
] as const;

export type LogLevelName = (typeof LOG_LEVEL_NAMES)[number];

// Most severe first; picking a level enables it and everything above it
const SEVERITY_ORDER: LogLevel[] = [
	'fatal',
	'error',
	'warn',
	'log',
	'debug',
	'verbose',
];

export function isLogLevelName(value: string): value is LogLevelName {
	return (LOG_LEVEL_NAMES as readonly string[]).includes(value);
}

export function logLevelsFor(name: LogLevelName): LogLevel[] {
	if (name === 'silent') return [];

	const level: LogLevel = name === 'info' ? 'log' : name;

	return SEVERITY_ORDER.slice(0, SEVERITY_ORDER.indexOf(level) + 1);
}
