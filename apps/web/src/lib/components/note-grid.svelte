<script>
import { Eraser, FolderInput, Palette, Pen, Square, SquareCheck } from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '$lib/components/ui/alert-dialog/index.js';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuRadioGroup,
	ContextMenuRadioItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
	ContextMenuTrigger,
} from '$lib/components/ui/context-menu/index.js';
import { Popover, PopoverContent } from '$lib/components/ui/popover/index.js';
import { getCategories } from '$lib/providers/categories-provider.svelte';
import { getNotes } from '$lib/providers/notes-provider.svelte';
import { COLORS } from '$lib/providers/notes.svelte.js';
import { focusAction, toTitleCase } from '$lib/utils.js';
import Note from './note.svelte';
import SaveHint from './save-hint.svelte';

// Every note is rendered; isShown(note) says which ones the page wants seen,
// and the rest are hidden rather than removed
let { isShown } = $props();

const categories = getCategories();
const notes = getNotes();

// One note is edited at a time: starting another ends the first
let editingId = $state(null);

// The menu, the delete dialog and the details popover exist once for the whole
// grid, and each remembers which note it's showing. Ids, so they always show
// the note as it is now
let menuId = $state(null);
let menuNote = $derived(notes.list.find((note) => note.id === menuId));

let deleteId = $state(null);
let isDeleteOpen = $state(false);
let deleteButton = $state(null);

let detailsId = $state(null);
let detailsNote = $derived(notes.list.find((note) => note.id === detailsId));
let detailsAnchor = $state(null);
let isDetailsOpen = $state(false);

// For "Move to". Radio values are strings, so "All" (no category) is the empty string
let folders = $derived([{ id: '', label: 'all' }, ...categories.list]);

// Right-clicking a note opens the menu for it. Anywhere else, or on a note
// being edited, the trigger is disabled before the menu reads it, so the
// browser's own menu shows instead (for copy and paste in the editor)
function pickMenuNote(e) {
	const id = e.target.closest('[data-note-id]')?.dataset.noteId ?? null;
	menuId = id === editingId ? null : id;
}

async function toggleComplete(note) {
	try {
		await notes.toggleComplete(note);
		toast.success(note.isCompleted ? 'Marked note as not done' : 'Marked note as done');
	} catch {
		// Refused: the socket provider has already toasted why
	}
}

async function moveTo(note, categoryId) {
	const folder = folders.find((folder) => folder.id === categoryId);
	try {
		await notes.update({ ...note, categoryId: categoryId || null });
		toast.success(`Moved note to ${toTitleCase(folder.label)}`);
	} catch {
		// Refused: the socket provider has already toasted why
	}
}

async function recolour(note, backgroundColor) {
	try {
		await notes.update({ ...note, backgroundColor });
	} catch {
		// Refused: the socket provider has already toasted why
	}
}

function confirmDelete(note) {
	deleteId = note.id;
	isDeleteOpen = true;
}

async function handleDelete() {
	try {
		await notes.remove(deleteId);
		toast.success('Deleted note');
	} catch {
		// Refused: the socket provider has already toasted why
	} finally {
		isDeleteOpen = false;
	}
}

// The info button again closes it
function toggleDetails(note, anchor) {
	if (isDetailsOpen && detailsId === note.id) {
		isDetailsOpen = false;
		return;
	}
	detailsId = note.id;
	detailsAnchor = anchor;
	isDetailsOpen = true;
}

// "bg-baby-blue-ice" → "Baby Blue Ice"
function colourName(colour) {
	return toTitleCase(colour.replace('bg-', '').replaceAll('-', ' '));
}

function formatDate(isoString) {
	return new Date(isoString).toLocaleDateString('en-AU');
}
</script>

<ContextMenu>
	<ContextMenuTrigger disabled={!menuId} oncontextmenu={pickMenuNote}>
		{#snippet child({ props })}
			<div {...props} class="notes-grid">
				{#each notes.list as note (note.id)}
					<Note
						{note}
						hidden={!isShown(note)}
						bind:editing={
							() => editingId === note.id,
							(editing) => {
								if (editing) editingId = note.id;
								else if (editingId === note.id) editingId = null;
							}
						}
						ontoggle={toggleComplete}
						ondelete={confirmDelete}
						ondetails={toggleDetails}
					/>
				{/each}
			</div>
		{/snippet}
	</ContextMenuTrigger>

	<!-- Focus isn't handed back to the grid on close, or it would pull focus out
	     of the editor that "Edit" just opened -->
	<ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
		{#if menuNote}
			<ContextMenuItem onSelect={() => toggleComplete(menuNote)}>
				{#if menuNote.isCompleted}
					<Square /> Mark as not done
				{:else}
					<SquareCheck /> Mark as done
				{/if}
			</ContextMenuItem>

			<ContextMenuSeparator />

			<ContextMenuItem onSelect={() => (editingId = menuNote.id)}>
				<Pen /> Edit
			</ContextMenuItem>
			<ContextMenuSub>
				<ContextMenuSubTrigger><FolderInput /> Move to</ContextMenuSubTrigger>
				<ContextMenuSubContent>
					<ContextMenuRadioGroup
						value={menuNote.categoryId ?? ''}
						onValueChange={(categoryId) => moveTo(menuNote, categoryId)}
					>
						{#each folders as folder (folder.id)}
							<ContextMenuRadioItem value={folder.id}>{toTitleCase(folder.label)}</ContextMenuRadioItem>
						{/each}
					</ContextMenuRadioGroup>
				</ContextMenuSubContent>
			</ContextMenuSub>
			<ContextMenuSub>
				<ContextMenuSubTrigger><Palette /> Colour</ContextMenuSubTrigger>
				<ContextMenuSubContent>
					<ContextMenuRadioGroup
						value={menuNote.backgroundColor}
						onValueChange={(colour) => recolour(menuNote, colour)}
					>
						{#each COLORS as colour (colour)}
							<ContextMenuRadioItem value={colour}>
								<span class="note-swatch {colour}"></span>
								{colourName(colour)}
							</ContextMenuRadioItem>
						{/each}
					</ContextMenuRadioGroup>
				</ContextMenuSubContent>
			</ContextMenuSub>

			<ContextMenuSeparator />

			<ContextMenuItem variant="destructive" onSelect={() => confirmDelete(menuNote)}>
				<Eraser /> Delete
			</ContextMenuItem>
		{/if}
	</ContextMenuContent>
</ContextMenu>

<!-- Hangs off whichever note's info button opened it. Pressing that button
     again shouldn't count as clicking outside, or it would close and reopen -->
<Popover bind:open={isDetailsOpen}>
	<PopoverContent
		class="note-details"
		customAnchor={detailsAnchor}
		onInteractOutside={(e) => {
			if (detailsAnchor?.contains(e.target)) e.preventDefault();
		}}
	>
		{#if detailsNote}
			Created on: {formatDate(detailsNote.createdAt)}
			{#if detailsNote.isCompleted && detailsNote.completedAt}
				<br />Completed on: {formatDate(detailsNote.completedAt)}
			{/if}
		{/if}
	</PopoverContent>
</Popover>

<AlertDialog bind:open={isDeleteOpen}>
	<AlertDialogContent onOpenAutoFocus={(e) => focusAction(e, deleteButton)}>
		<AlertDialogHeader>
			<AlertDialogTitle>Delete this note?</AlertDialogTitle>
			<AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<SaveHint
				class="dialog-hint"
				action="delete"
				onsave={() => deleteButton.click()}
				oncancel={() => (isDeleteOpen = false)}
			/>
			<AlertDialogCancel>Cancel</AlertDialogCancel>
			<AlertDialogAction bind:ref={deleteButton} class="btn-danger dialog-action" onclick={handleDelete}>
				Delete
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>

<style>
@reference "../../app.css";

.notes-grid {
	@apply grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4;
}

/* A dot of each pastel in the context menu's Colour list */
.note-swatch {
	@apply size-3.5 shrink-0 rounded-full border border-black/15;
}

/* The popover is portaled out of the component, so it can't be scoped */
:global(.note-details) {
	@apply w-auto text-sm;
}
</style>
