<script module>
import { createContext } from 'svelte';

// Anything under a CategoriesProvider reaches the categories with getCategories()
export const [getCategories, setCategories] = createContext();
</script>

<script>
import { onDestroy } from 'svelte';
import { Categories } from './categories.svelte.js';
import { getSocket } from './socket-provider.svelte';

let { children } = $props();

// Loads on every connect of the socket; showing the loading and errors is up to
// whoever renders under here
const categories = setCategories(new Categories(getSocket().client));
onDestroy(() => categories.destroy());
</script>

{@render children()}
