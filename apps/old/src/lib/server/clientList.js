// Stores all connected clients
import { logger } from '$lib/server/logger.js';

/** @type {Map<string, Map<string, (eventName:string,data:string)=>import('sveltekit-sse').Unsafe<void,Error>>>} **/
export const clients = new Map();

/** @type {function(workspaceId:string,eventName:string,msg:*):void} **/
export function sendMessage(passphrase, eventName, msg) {
	if (!passphrase) throw new Error('No workspaceId provided');

	const clientList = clients.get(passphrase);

	if (!clientList)
		throw new Error(`No clients are connected to the ${passphrase} workspace`);

	clientList.forEach((emit) => {
		const { error } = emit(eventName, JSON.stringify(msg));

		if (error) {
			logger.error(error);
		}
	});
}
