<script>
import { CircleCheck, Eraser, InfoIcon, Pen, Square, SquareCheck } from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { Button } from '$lib/components/ui/button/index.js';
import { getNotes } from '$lib/providers/notes-provider.svelte';
import { focusAtEnd, isPlainEnter } from '$lib/utils.js';
import { renderMarkdown } from '$lib/utils/markdown.js';
import SaveHint from './save-hint.svelte';
import './styles/note.css';

// Only the card itself lives here. The right-click menu, the delete dialog and
// the details popover are shared by the whole grid (note-grid.svelte), which
// these callbacks open, so a note costs little to create
let { note, hidden = false, editing = $bindable(false), ontoggle, ondelete, ondetails } = $props();

const notes = getNotes();

// Starts from the saved markdown each time editing starts, and typing overrides
// it until then
let editingText = $derived(editing ? note.text : '');
let editor = $state(null);
let isSavingEdit = false;

let html = $derived(renderMarkdown(note.text));

// The pencil (or the grid's "Edit") is the only way in, and the pencil again
// works like Esc. It doesn't take focus when pressed (onmousedown), so pressing
// it mid-edit doesn't blur the editor before its click
function toggleEditing() {
	if (editing) return cancelEdit();
	editing = true;
}

// Like the workspace description: only Enter (or its hint button) saves, Esc or
// clicking away throw the edit away. Every exit goes through the blur, which is
// where that's decided
function saveEdit() {
	isSavingEdit = true;
	editor.blur();
}

function cancelEdit() {
	editor.blur();
}

function handleEditKeydown(e) {
	if (isPlainEnter(e)) {
		e.preventDefault();
		saveEdit();
	}
	if (e.key === 'Escape') cancelEdit();
}

async function handleEditBlur() {
	const text = editingText;
	const shouldSave = isSavingEdit && text.trim() && text !== note.text;
	isSavingEdit = false;
	editing = false;
	if (!shouldSave) return;

	try {
		await notes.update({ ...note, text });
		toast.success('Saved note');
	} catch (err) {
		toast.error(err.message);
	}
}
</script>

<!-- data-note-id tells the grid's shared right-click menu which note it's on.
     Filtered-out notes stay built and are only hidden -->
<div class="note {note.backgroundColor}" data-note-id={note.id} {hidden}>
	<div class="note-toolbar">
		<Button
			variant="ghost"
			size="icon"
			class={['note-action note-action-complete', note.isCompleted && 'is-done']}
			aria-label={note.isCompleted ? 'Mark as not done' : 'Mark as done'}
			onclick={() => ontoggle(note)}
		>
			{#if note.isCompleted}
				<SquareCheck />
			{:else}
				<Square />
			{/if}
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class={['note-action note-action-edit', editing && 'is-active']}
			aria-label="Edit"
			onmousedown={(e) => e.preventDefault()}
			onclick={toggleEditing}
		>
			<Pen />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="note-action note-action-delete"
			aria-label="Delete"
			onclick={() => ondelete(note)}
		>
			<Eraser />
		</Button>
	</div>

	{#if editing}
		<!-- The raw markdown, edited in the spot the rendered text was in -->
		<div
			class="note-font note-editor"
			contenteditable="plaintext-only"
			role="textbox"
			tabindex="0"
			aria-multiline="true"
			aria-label="Note text"
			bind:this={editor}
			bind:textContent={editingText}
			onkeydown={handleEditKeydown}
			onblur={handleEditBlur}
			{@attach focusAtEnd}
		></div>
	{:else}
		<div class={['note-font note-body prose', note.isCompleted && 'is-done']}>
			{@html html}
		</div>
	{/if}

	<div class="note-footer">
		<!-- While editing, the save hint takes the footer on its own -->
		{#if editing}
			<SaveHint onsave={saveEdit} oncancel={cancelEdit} />
		{:else}
			<Button
				variant="ghost"
				size="icon"
				class="note-action"
				aria-label="Details"
				onclick={(e) => ondetails(note, e.currentTarget)}
			>
				{#if note.isCompleted}
					<CircleCheck />
				{:else}
					<InfoIcon />
				{/if}
			</Button>
		{/if}
	</div>
</div>
