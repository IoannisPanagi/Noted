import { writable } from 'svelte/store';
import { api } from '$lib/utils/api.js';
import { socket } from '$lib/utils/socket.js';

// The workspace the auth cookie points at, or null before it loads and after it's destroyed
function createWorkspaceStore() {
	const { subscribe, set } = writable(null);

	socket.on('workspace.updated', set);
	socket.on('workspace.destroyed', () => set(null));

	return {
		subscribe,

		loadWorkspace: async () => {
			const { data } = await api.get('/workspaces/me');
			set(data);
		},

		// The server replaces both fields, so an omitted password unlocks the workspace
		updateWorkspace: async ({ description, password }) => {
			socket.emit(
				'update.workspace',
				{ workspace: { description, password } },
				(res) => {
					if (res.ok) {
						set(res.data);
					} else throw new Error('Failed to update workspace');
				},
			);
		},
	};
}

export const workspace = createWorkspaceStore();
