import { api } from '$lib/utils/api.js';

// The workspace the auth cookie points at. It lives as long as the
// WorkspaceProvider that made it, which takes its listeners off the socket
export class Workspace {
	// null before it loads and after it's destroyed. Raw: it's only ever replaced
	current = $state.raw(null);
	loading = $state(true);
	error = $state.raw(null);

	#socket;
	#listeners = {
		'workspace.updated': (workspace) => (this.current = workspace),
		'workspace.destroyed': () => (this.current = null),
	};

	constructor(socket) {
		this.#socket = socket;
		for (const [event, handler] of Object.entries(this.#listeners)) socket.on(event, handler);
	}

	// The one load allowed over REST. A failure lands in error rather than
	// being thrown, for whoever shows it
	async load() {
		try {
			const { data } = await api.get('/workspaces/me');
			this.current = data;
			this.error = null;
		} catch (err) {
			this.error = err;
		} finally {
			this.loading = false;
		}
	}

	// The server replaces both fields, so an omitted password unlocks the workspace.
	// Awaiting the acknowledgement means a refusal reaches the caller's catch
	async update({ description, password }) {
		const res = await this.#socket.emitWithAck('update.workspace', {
			workspace: { description, password },
		});
		if (!res.ok) throw new Error('Failed to update workspace');
		this.current = res.data;
	}

	destroy() {
		for (const [event, handler] of Object.entries(this.#listeners)) this.#socket.off(event, handler);
	}
}
