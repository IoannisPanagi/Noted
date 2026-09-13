import { error } from '@sveltejs/kit';
import { produce } from 'sveltekit-sse';
import { clients } from '$lib/server/clientList.js';
import { logger } from '$lib/server/logger.js';

export function POST({ locals: { sessionId, workspace } }) {
	if (!sessionId) throw error(400, 'MISSING SESSION ID');

	return produce(
		async function start({ emit }) {
			logger.debug('SSE connection established');

			const { error } = emit('health', 'ok');

			if (error) {
				logger.error(error);
			}

			const existingMap = clients.get(workspace.passphrase);

			if (existingMap) {
				existingMap.set(sessionId, emit);

				clients.set(workspace.passphrase, existingMap);
			} else {
				clients.set(workspace.passphrase, new Map().set(sessionId, emit));
			}
		},
		{
			stop() {
				logger.debug(`SSE connection closed for session ${sessionId}`);

				const connectedClients = clients.get(workspace.passphrase);

				if (!connectedClients) return;

				connectedClients.delete(sessionId);

				if (connectedClients.size === 0) {
					clients.delete(workspace.passphrase);
				}
			},
		},
	);
}
