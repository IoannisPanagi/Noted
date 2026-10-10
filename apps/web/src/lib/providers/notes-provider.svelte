<script module>
import { createContext } from 'svelte';

export const [getNotes, setNotes] = createContext();
</script>

<script>
import { onDestroy } from 'svelte';
import { Notes } from './notes.svelte.js';
import { getSocket } from './socket-provider.svelte';

let { children } = $props();

const notes = setNotes(new Notes(getSocket().client));
onDestroy(() => notes.destroy());
</script>

{@render children()}
