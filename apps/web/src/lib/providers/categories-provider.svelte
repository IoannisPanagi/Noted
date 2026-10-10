<script module>
import { createContext } from 'svelte';

export const [getCategories, setCategories] = createContext();
</script>

<script>
import { onDestroy } from 'svelte';
import { Categories } from './categories.svelte.js';
import { getSocket } from './socket-provider.svelte';

let { children } = $props();

const categories = setCategories(new Categories(getSocket().client));
onDestroy(() => categories.destroy());
</script>

{@render children()}
