<script module>
import { createContext } from 'svelte';

// Anything under a SocketProvider reaches the connection with getSocket()
export const [getSocket, setSocket] = createContext();
</script>

<script>
import { onMount } from 'svelte';
import { Socket } from './socket.svelte.js';

let { children } = $props();

// One connection for everything under this provider, open while it's mounted.
// By mount the children have set up their listeners, so connecting then means
// none of them miss the first connect
const socket = setSocket(new Socket());

onMount(() => {
	socket.connect();
	return () => socket.destroy();
});
</script>

{@render children()}
