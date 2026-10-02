<script module>
// One ResizeObserver for every note body, rather than one per note
const overflowChecks = new WeakMap();
let bodyObserver;

function observeBody(el, check) {
	bodyObserver ??= new ResizeObserver((entries) => {
		for (const entry of entries) overflowChecks.get(entry.target)?.();
	});
	overflowChecks.set(el, check);
	bodyObserver.observe(el);
	return () => {
		bodyObserver.unobserve(el);
		overflowChecks.delete(el);
	};
}
</script>

<script>
import { ChevronDown, CircleCheck, Eraser, InfoIcon, Pen, Square, SquareCheck } from '@lucide/svelte';
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

// A note whose text doesn't fit its square can be expanded. It floats over the
// notes below instead of stretching its row, and any number can be open
let expanded = $state(false);
let overflows = $state(false);

// Collapsed, a long note is cut at the last line that fits, which ends in an
// ellipsis. The card's height varies with the grid, so the number of lines is
// searched for. Redone whenever the text changes, the card resizes or the note
// fonts finish loading. Expanded, the arrow stays to fold it back
function fitText(body) {
	html;
	const text = body.firstElementChild;
	text.style.display = '';
	text.style.webkitLineClamp = '';
	if (expanded) return;

	const fit = () => {
		text.style.display = '';
		text.style.webkitLineClamp = '';
		overflows = text.offsetHeight > body.clientHeight + 1;
		if (!overflows) return;

		text.style.display = '-webkit-box';
		let lo = 1;
		let hi = Math.max(1, Math.floor(body.clientHeight / 16));
		while (lo < hi) {
			const mid = Math.ceil((lo + hi) / 2);
			text.style.webkitLineClamp = mid;
			if (text.offsetHeight <= body.clientHeight) lo = mid;
			else hi = mid - 1;
		}
		text.style.webkitLineClamp = lo;
	};
	document.fonts.ready.then(fit);
	return observeBody(body, fit);
}

// Clicking anywhere on the card toggles it, except on its buttons and links,
// while editing, or when the click ends a text selection
function handleCardClick(e) {
	if (!overflows || editing) return;
	if (e.target.closest('button, a')) return;
	if (!window.getSelection()?.isCollapsed) return;
	expanded = !expanded;
}

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
     Filtered-out notes stay built and are only hidden. The slot keeps the
     note's square in the grid, so an expanded card can grow out of it -->
<div class="note-slot" data-note-id={note.id} {hidden}>
	<!-- The arrow button is the keyboard's way to expand -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class={['note', note.backgroundColor, overflows && !editing && 'is-expandable', expanded && 'is-expanded']}
		onclick={handleCardClick}
	>
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
			<div class={['note-font note-body prose', note.isCompleted && 'is-done']} {@attach fitText}>
				<div class="note-text">{@html html}</div>
			</div>
		{/if}

		<div class="note-footer">
			<!-- While editing, the save hint takes the footer on its own -->
			{#if editing}
				<SaveHint onsave={saveEdit} oncancel={cancelEdit} />
			{:else}
				{#if overflows}
					<button
						class="note-expand"
						aria-label={expanded ? 'Collapse note' : 'Expand note'}
						aria-expanded={expanded}
						onclick={() => (expanded = !expanded)}
					>
						<ChevronDown />
					</button>
				{/if}
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
</div>
