<script>
import Masonry from 'svelte-bricks';
import Loading from '$lib/components/loading.svelte';
import Note from '$lib/components/note.svelte';
import { notes } from '$lib/stores/notes.js';

let isLoading = $state(false);
let error = $state(null);

let { searchCategoryParam, showCompleted } = $props();

let [minColWidth, maxColWidth, gap] = [250, 400, 12];

$effect(async () => {
	isLoading = true;

	try {
		await notes.loadNotes(searchCategoryParam);
	} catch (err) {
		error = err;
	} finally {
		isLoading = false;
	}
});
</script>

{#if isLoading}
	<Loading class="h-full" description="Loading notes..." />
{:else if error}
	Failed to load your notes... <br />
	<p class="text-red-500">
		{error}
	</p>
{:else}
	<div>
		{#if $notes.length > 0}
			<Masonry
				animate={true}
				duration={100}
				items={$notes.filter(note => searchCategoryParam === 'completed' || (!note.isCompleted || note.isCompleted === showCompleted))}
				idKey='id'
				{minColWidth}
				{maxColWidth}
				{gap}
				class="p-4"
			>
				{#snippet children({ item: note })}
					<Note {note} />
				{/snippet}
			</Masonry>
		{:else}
			<p>No notes found, add a new one!</p>
		{/if}
	</div>
{/if}