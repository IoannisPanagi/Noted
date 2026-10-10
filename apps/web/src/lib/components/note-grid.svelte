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

let { isShown } = $props();

const categories = getCategories();
const notes = getNotes();

let editingId = $state(null);

// Shared by the whole grid. Ids, so they always show the note's current state
let menuId = $state(null);
let menuNote = $derived(notes.list.find((note) => note.id === menuId));

let deleteId = $state(null);
let isDeleteOpen = $state(false);
let deleteButton = $state(null);

let detailsId = $state(null);
let detailsNote = $derived(notes.list.find((note) => note.id === detailsId));
let detailsAnchor = $state(null);
let isDetailsOpen = $state(false);

// Radio values are strings, so "All" (no category) is the empty string
let folders = $derived([{ id: '', label: 'all' }, ...categories.list]);

// Looked up once here, so each note doesn't search the categories itself. Empty inside a category, where every label would be the same
let categoryLabels = $derived(
	new Map(categories.activeId ? [] : categories.list.map((category) => [category.id, toTitleCase(category.label)])),
);

// No note (or the one being edited) disables the menu, leaving the browser's own for copy and paste
function handleContextMenu(e) {
	const id = e.target.closest('[data-note-id]')?.dataset.noteId ?? null;
	menuId = id === editingId ? null : id;
}

async function toggleComplete(note) {
	try {
		await notes.toggleComplete(note);
		toast.success(note.isCompleted ? 'Marked note as not done' : 'Marked note as done');
	} catch {
		// The socket provider already toasted the error
	}
}

async function moveTo(note, categoryId) {
	const folder = folders.find((folder) => folder.id === categoryId);
	try {
		await notes.update({ ...note, categoryId: categoryId || null });
		toast.success(`Moved note to ${toTitleCase(folder.label)}`);
	} catch {
		// The socket provider already toasted the error
	}
}

async function recolour(note, backgroundColor) {
	try {
		await notes.update({ ...note, backgroundColor });
	} catch {
		// The socket provider already toasted the error
	}
}

function handleDeleteRequest(note) {
	deleteId = note.id;
	isDeleteOpen = true;
}

async function handleDelete() {
	try {
		await notes.remove(deleteId);
		toast.success('Deleted note');
	} catch {
		// The socket provider already toasted the error
	} finally {
		isDeleteOpen = false;
	}
}

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
	<ContextMenuTrigger disabled={!menuId} oncontextmenu={handleContextMenu}>
		{#snippet child({ props })}
			<div {...props} class="notes-grid">
				{#each notes.list as note (note.id)}
					<Note
						{note}
						category={categoryLabels.get(note.categoryId)}
						hidden={!isShown(note)}
						bind:editing={
							() => editingId === note.id,
							(editing) => {
								if (editing) editingId = note.id;
								else if (editingId === note.id) editingId = null;
							}
						}
						ontoggle={toggleComplete}
						ondelete={handleDeleteRequest}
						ondetails={toggleDetails}
					/>
				{/each}
			</div>
		{/snippet}
	</ContextMenuTrigger>

	<!-- Returning focus would pull it out of the editor "Edit" just opened -->
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

			<ContextMenuItem variant="destructive" onSelect={() => handleDeleteRequest(menuNote)}>
				<Eraser /> Delete
			</ContextMenuItem>
		{/if}
	</ContextMenuContent>
</ContextMenu>

<!-- Clicking the anchoring info button again must not count as outside, or it would close and reopen -->
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

.note-swatch {
	@apply size-3.5 shrink-0 rounded-full border border-black/15;
}

/* Portaled, so it can't be scoped */
:global(.note-details) {
	@apply w-auto text-sm;
}
</style>
