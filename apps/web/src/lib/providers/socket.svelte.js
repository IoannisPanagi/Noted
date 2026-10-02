import { io } from 'socket.io-client';
import { toast } from 'svelte-sonner';
import { api } from '$lib/utils/api.js';

// The workspace's Socket.IO connection. It lives as long as the SocketProvider
// that made it. It isn't opened here: connect() is called once whoever listens
// on it has added their listeners, so nothing sent on connecting is missed
export class Socket {
	// A message the server rejects is never answered (see 'exception' below), so
	// every emitWithAck gives up after ackTimeout and rejects into the caller's catch
	client = io(`${import.meta.env.VITE_API_URL}/workspace`, {
		withCredentials: true,
		autoConnect: false,
		ackTimeout: 5000,
	});

	// Until the first connection, or the refusal that ends trying
	loading = $state(true);
	// Only set once the server refused us; dropped connections retry on their own
	error = $state.raw(null);

	constructor() {
		// Rooms are dropped on every reconnect, so the join has to be repeated each time
		this.client.on('connect', () => {
			this.loading = false;
			this.error = null;
			this.client.emit('join.workspace');
		});

		// An inactive socket was refused by the server and won't retry on its own
		this.client.on('connect_error', (error) => {
			if (this.client.active) return;
			this.loading = false;
			this.error = error;
		});

		// The server says why it rejected a message (a missing id, a stale session,
		// an error of its own) on this event instead of in the message's answer
		this.client.on('exception', ({ message }) => {
			toast.error(message);
		});

		// The workspace changed, so our session cookie may be stale. Try a fresh
		// password-less login (works while the workspace is open), then reconnect
		// so the handshake carries the new cookie and the connect handler re-joins
		this.client.on('auth.refresh', async (passphrase) => {
			try {
				await api.post('/login', { passphrase, password: null });
			} catch {
				// Locked with a password we don't have; the re-join will be refused
			}

			this.client.disconnect().connect();
		});
	}

	connect() {
		this.client.connect();
	}

	destroy() {
		this.client.disconnect();
	}
}
