import { io } from 'socket.io-client';
import { api } from '$lib/utils/api.js';
import { API_URL } from '../../constants.js';

// One connection shared by every store. It stays closed until a workspace page
// calls socket.connect(), since the server needs the auth cookie to let us in.
export const socket = io(`${API_URL}/workspace`, {
	withCredentials: true,
	autoConnect: false,
});

// Rooms are dropped on every reconnect, so the join has to be repeated each time
socket.on('connect', () => {
	socket.emit('join.workspace');
});

// The workspace changed, so our session cookie may be stale. Try a fresh
// password-less login (works while the workspace is open), then reconnect so
// the handshake carries the new cookie and the connect handler re-joins.
socket.on('auth.refresh', async (passphrase) => {
	try {
		await api.post('/login', { passphrase, password: null });
	} catch {
		// Locked with a password we don't have; the re-join will be refused
	}

	socket.disconnect().connect();
});

socket.on('connect_error', (error) => {
	// An inactive socket was refused by the server and won't retry on its own
	if (!socket.active) console.error(error.message);
});
