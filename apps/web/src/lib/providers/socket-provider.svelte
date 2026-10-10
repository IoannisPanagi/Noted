<script module>
import { createContext } from 'svelte';

export const [getSocket, setSocket] = createContext();
</script>

<script>
import { onMount } from 'svelte';
import { Socket } from './socket.svelte.js';

let { children } = $props();

// Connects on mount, once the children's listeners are set up, so none miss the first connect
const socket = setSocket(new Socket());

onMount(() => {
	socket.connect();
	return () => socket.destroy();
});
</script>

{@render children()}
