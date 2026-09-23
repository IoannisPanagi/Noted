import '$lib/server/database/database.js';
import { randomUUID } from 'node:crypto';
import { error, redirect } from '@sveltejs/kit';
import { logger } from '$lib/server/logger.js';
import { extractPayload } from '$lib/server/services/jws.service.js';
import { getFromPassphrase } from '$lib/server/services/workspace.service.js';

logger.info(`Starting Noted version ${process.env.npm_package_version}`);
logger.info('Starting backend api...');
logger.info('Backend API started');

const publicRoutes = ['/', '/api/auth', '/notes/'];

function isPublicRoute(dest) {
	if (dest === '/') {
		return true;
	}

	return publicRoutes.some((route) => route !== '/' && dest.startsWith(route));
}

export async function handle({ event, resolve }) {
	if (!event.cookies.get('session-id')) {
		event.cookies.set('session-id', randomUUID(), {
			path: '/',
			sameSite: 'strict',
		});
	}

	event.locals.sessionId = event.cookies.get('session-id');

	if (isPublicRoute(event.url.pathname)) {
		return resolve(event);
	}

	logger.trace('Challenging logged in user');

	const token = event.cookies.get('noted-authentication');
	logger.trace(`Received ${token}`);

	const payload = extractPayload(token);
	logger.trace(`The token payload is ${JSON.stringify(payload)}`);

	if (!payload) {
		if (event.url.pathname.startsWith('/api')) {
			throw error(403, 'You are unauthorized');
		} else throw redirect(303, '/');
	}

	const { passphrase } = payload.data;

	if (!passphrase) {
		event.cookies.delete('noted-authentication', { path: '/' });
	}

	const workspace = await getFromPassphrase(passphrase);

	event.locals.workspace = {
		...workspace,
		password: undefined,
	};

	return resolve(event);
}
