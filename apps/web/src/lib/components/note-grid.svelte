<script>
import Note from '$lib/components/note.svelte';

let { notes = [] } = $props();
</script>

{#if notes.length > 0}
	<div class="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
		{#each notes as note (note.id)}
			<Note {note} />
		{/each}
	</div>
{:else}
	<p>No notes found, add a new one!</p>
{/if}
