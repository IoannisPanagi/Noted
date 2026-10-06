<script>
import Loading from '$lib/components/loading.svelte';
import CategoryFolders from '$lib/components/category-folders.svelte';
import NoteGrid from '$lib/components/note-grid.svelte';
import NoteTopBar from '$lib/components/note-top-bar.svelte';
import { getCategories } from '$lib/providers/categories-provider.svelte';
import { getNotes } from '$lib/providers/notes-provider.svelte';
import { getSocket } from '$lib/providers/socket-provider.svelte';
import { getWorkspace } from '$lib/providers/workspace-provider.svelte';
import { readShowCompleted, setShowCompleted } from '$lib/utils/localStorage.js';

const socket = getSocket();
const workspace = getWorkspace();
const categories = getCategories();
const notes = getNotes();

// Shows the first failure, otherwise whatever is still loading
let error = $derived(socket.error ?? workspace.error ?? categories.error ?? notes.error);
let loading = $derived(
	(socket.loading && 'Connecting...') ||
		(workspace.loading && 'Loading your workspace...') ||
		(categories.loading && 'Loading your categories...') ||
		(notes.loading && 'Loading your notes...'),
);

let showCompleted = $state(readShowCompleted() ?? false);

$effect(() => setShowCompleted(showCompleted));

// Notes are hidden rather than removed, since building one is the expensive part
const isShown = (note) =>
	(categories.activeId === null || note.categoryId === categories.activeId) &&
	(showCompleted || !note.isCompleted);
let shownCount = $derived(notes.list.filter(isShown).length);
</script>

{#if error}
	<p class="notes-error">{error.message ?? 'Something went wrong loading your workspace'}</p>
{:else if loading}
	<Loading description={loading} />
{:else}
	<div class="notes-page">
		<NoteTopBar categoryId={categories.activeId} />

		<CategoryFolders bind:showCompleted>
			<NoteGrid {isShown} />
			{#if shownCount === 0}
				<p class="notes-empty">Nothing here yet. Write a note above to add one.</p>
			{/if}
		</CategoryFolders>
	</div>
{/if}

<style>
@reference "../../app.css";

.notes-page {
	@apply p-8 pt-6;
}

.notes-empty {
	@apply py-8 text-center text-sm text-muted-foreground;
}

.notes-error {
	@apply p-5 text-destructive;
}
</style>
