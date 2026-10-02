<script module>
import { createContext } from 'svelte';

// Anything under a NotesProvider reaches the notes with getNotes()
export const [getNotes, setNotes] = createContext();
</script>

<script>
import { onDestroy } from 'svelte';
import { Notes } from './notes.svelte.js';
import { getSocket } from './socket-provider.svelte';

let { children } = $props();

// Loads on every connect of the socket; showing the loading and errors is up to
// whoever renders under here
const notes = setNotes(new Notes(getSocket().client));
onDestroy(() => notes.destroy());
</script>

{@render children()}
