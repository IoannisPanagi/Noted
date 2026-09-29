<script>
import { goto } from '@roxi/routify';
import { onMount } from 'svelte';
import { toast } from 'svelte-sonner';
import Loading from '$lib/components/loading.svelte';
import { api } from '$lib/utils/api.js';

let { passphrase } = $props();

// Read during init: Svelte 5 subscribes lazily and Routify's context is gone by the time .then runs
// typeof Function
const navigate = $goto;

onMount(() => {
	// replace, so going back doesn't land here and log in again
	api
		.post('/login', JSON.stringify({ passphrase, password: null }))
		.then(() => navigate('/notes', {}, { mode: 'replace' }))
		.catch((err) => {
			toast.error(err?.message ?? 'Could not open that workspace');
			navigate('/', {}, { mode: 'replace' });
		});
});
</script>

<Loading description="Setting your workspace" />
