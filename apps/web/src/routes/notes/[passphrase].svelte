<script>
import { goto } from '@roxi/routify';
import { onMount } from 'svelte';
import { toast } from 'svelte-sonner';
import Loading from '$lib/components/loading.svelte';
import { api } from '$lib/utils/api';

let { passphrase } = $props();

onMount(() => {
	// replace, so going back doesn't land here and log in again
	api
		.post('/login', JSON.stringify({ passphrase }))
		.then(() => $goto('/notes', {}, { mode: 'replace' }))
		.catch((err) => {
			toast.error(err?.message ?? 'Could not open that workspace');
			$goto('/', {}, { mode: 'replace' });
		});
});
</script>

<Loading description="Setting your workspace" />
