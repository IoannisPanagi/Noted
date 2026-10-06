import { io } from 'socket.io-client';
import { toast } from 'svelte-sonner';
import { api } from '$lib/utils/api.js';

// Not connected here: connect() runs once listeners are added, so nothing sent on connect is missed
export class Socket {
	// Rejected messages are never answered (see 'exception'), so acks time out into the caller's catch
	client = io(`${import.meta.env.VITE_API_URL}/workspace`, {
		withCredentials: true,
		autoConnect: false,
		ackTimeout: 5000,
	});

	loading = $state(true);
	// Only set on refusal; dropped connections retry on their own
	error = $state.raw(null);

	constructor() {
		// Rooms are dropped on reconnect, so the join is repeated
		this.client.on('connect', () => {
			this.loading = false;
			this.error = null;
			this.client.emit('join.workspace');
		});

		// An inactive socket was refused and won't retry
		this.client.on('connect_error', (error) => {
			if (this.client.active) return;
			this.loading = false;
			this.error = error;
		});

		this.client.on('exception', ({ message }) => {
			toast.error(message);
		});

		// The cookie may be stale: re-login without a password (works while open), then reconnect to re-join
		this.client.on('auth.refresh', async (passphrase) => {
			try {
				await api.post('/login', { passphrase, password: null });
			} catch {
				// Locked, so the re-join will be refused
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
