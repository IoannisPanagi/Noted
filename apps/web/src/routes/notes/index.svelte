<script>
import { goto } from '@roxi/routify';
import { onMount } from 'svelte';
import Loading from '$lib/components/loading.svelte';
import NoteGrid from '$lib/components/note-grid.svelte';
import NoteTopBar from '$lib/components/note-top-bar.svelte';
import { notes } from '$lib/stores/notes.js';
import { workspace } from '$lib/stores/workspace.js';
import { socket } from '$lib/utils/socket.js';

const navigate = $goto;

// The page renders only once both have loaded
const loading = Promise.all([workspace.loadWorkspace(), notes.loadNotes()]);

onMount(() => {
	socket.connect();

	// Leave page, kill connection
	return () => socket.disconnect();
});
</script>

{#await loading}
	<Loading description="Loading your workspace..." />
{:then}
	<div class="p-5">
		<NoteTopBar />

		<hr class="border border-gray-500 mb-5" />

		<NoteGrid notes={$notes} />
	</div>
{:catch err}
	{#if err.statusCode === 403 || err.statusCode === 401}
		{navigate('/')}
	{/if}
	<p class="p-5 text-red-600">{err?.message ?? 'Could not load the workspace'}</p>
{/await}
