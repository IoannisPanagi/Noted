import { isLogLevelName, logLevelsFor } from '@noted/logging/log-levels';

describe('log levels', () => {
	it('enables the chosen level and everything more severe', () => {
		expect(logLevelsFor('info')).toEqual(['fatal', 'error', 'warn', 'log']);
		expect(logLevelsFor('warn')).toEqual(['fatal', 'error', 'warn']);
		expect(logLevelsFor('error')).toEqual(['fatal', 'error']);
	});

	it("maps 'info' onto Nest's 'log' and keeps the more verbose levels", () => {
		expect(logLevelsFor('info')).toContain('log');
		expect(logLevelsFor('debug')).toEqual([
			'fatal',
			'error',
			'warn',
			'log',
			'debug',
		]);
		expect(logLevelsFor('verbose')).toHaveLength(6);
	});

	it('turns everything off for silent', () => {
		expect(logLevelsFor('silent')).toEqual([]);
	});

	it('recognises only the documented names', () => {
		expect(isLogLevelName('info')).toBe(true);
		expect(isLogLevelName('silent')).toBe(true);
		expect(isLogLevelName('trace')).toBe(false);
		expect(isLogLevelName('')).toBe(false);
	});
});
