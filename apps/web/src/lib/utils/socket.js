import { io } from 'socket.io-client';
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

socket.on('auth.refresh', () => {
  socket.disconnect();
  socket.emit('join.workspace');
});

socket.on('connect_error', (error) => {
	// An inactive socket was refused by the server and won't retry on its own
	if (!socket.active) console.error(error.message);
});
