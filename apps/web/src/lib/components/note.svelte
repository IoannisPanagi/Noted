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
	} catch {
		// Refused: the socket provider has already toasted why
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

<style>
@reference "../../app.css";

.note-slot {
	@apply relative aspect-square;
}

/* Fills its slot, and expanded grows downwards out of it, floating over the
   notes below rather than making its whole row taller */
.note {
	@apply absolute inset-x-0 top-0 flex h-full flex-col rounded-xl p-3 text-gray-900 shadow-sm;
}

.note.is-expandable {
	@apply cursor-pointer;
}

.note.is-expanded {
	@apply z-10 h-auto min-h-full shadow-xl;
}

.note-toolbar {
	@apply flex justify-end gap-0.5;
}

/* The details button stays on the right; the save hint, while editing, on the
   left; the expand arrow in the middle */
.note-footer {
	@apply relative flex items-center justify-end pt-1;
}

.note-expand {
	@apply absolute left-1/2 -translate-x-1/2 cursor-pointer rounded-md px-2 text-gray-700 hover:bg-black/5 hover:text-gray-900;
}

.note-expand :global(svg) {
	@apply size-5 transition-transform;
}

.note.is-expanded .note-expand :global(svg) {
	@apply rotate-180;
}

.note-footer :global(.save-hint) {
	@apply me-auto;
}

/* On the pastel the hint buttons keep the note's ink and hover like the note's
   other actions, instead of the theme's hover colours */
.note :global(.save-hint-action) {
	@apply text-gray-900 hover:bg-black/5;
}

/* Icon actions sit on the pastel, so all of them (toolbar and footer) keep the
   note's dark text and get the same faint dark tint on hover, in both modes.
   They're shadcn Buttons, hence global under the scoped note */
.note :global(.note-action) {
	@apply text-gray-900 hover:bg-black/5;
}

.note :global(.note-action svg) {
	@apply size-5;
}

/* A done note's tick is a deep green: the theme's success green blended into
   the green and blue pastels */
.note :global(.note-action-complete) {
	@apply hover:text-green-700;
}

.note :global(.note-action-complete.is-done) {
	@apply text-green-700;
}

.note :global(.note-action-edit) {
	@apply hover:text-primary;
}

.note :global(.note-action-edit.is-active) {
	@apply text-primary;
}

.note :global(.note-action-delete) {
	@apply hover:text-destructive;
}

/* Comic Neue has no medium weight, so Regular is thickened with a hairline
   stroke. That keeps **bold** in markdown visibly bolder than the rest */
.note-font {
	font-family: "Comic Neue", cursive;
	font-weight: 400;
	-webkit-text-stroke: 0.35px currentColor;
}

/* The raw markdown, edited where the rendered text sits: same spot and ink, a
   faint wash to show it's being edited, and it scrolls instead of fading */
.note-editor {
	@apply -mx-1 min-h-0 flex-1 overflow-y-auto rounded-md bg-white/50 px-2 py-1 leading-7 whitespace-pre-wrap wrap-break-word outline-none;
}

/* Rendered markdown, used together with `prose`. Colours follow the note's dark
   text rather than the theme, since notes stay light in dark mode too */
.note-body {
	@apply min-h-0 flex-1 overflow-hidden px-1 wrap-break-word;

	--tw-prose-body: var(--color-gray-900);
	--tw-prose-headings: var(--color-gray-900);
	--tw-prose-bold: var(--color-gray-900);
	--tw-prose-code: var(--color-gray-900);
	--tw-prose-links: var(--color-gray-900);
	--tw-prose-quotes: var(--color-gray-900);
	--tw-prose-bullets: var(--color-gray-700);
	--tw-prose-counters: var(--color-gray-700);
	--tw-prose-quote-borders: var(--rich-marine);
}

/* Collapsed long notes are line-clamped here (fitText sets the count), which
   needs the vertical box and hides what's past the last line */
.note-text {
	-webkit-box-orient: vertical;
	@apply overflow-hidden;
}

/* Prose drops the outer margins of its direct children only, which the
   wrapper now is. Without this the first and last blocks keep theirs, and a
   note that fits is measured as too long. The markdown comes from {@html}, so
   its elements are global */
.note-text > :global(:first-child) {
	@apply mt-0;
}

.note-text > :global(:last-child) {
	@apply mb-0;
}

.note-body.is-done {
	@apply line-through;
}

/* Tighter spacing than prose's article defaults, to fit a small card */
.note-body :global(:where(h1, h2, h3, h4, h5, h6)) {
	@apply mt-0 mb-2;
}

.note-body :global(:where(p, ul, ol)) {
	@apply my-1.5;
}

.note-body :global(:where(li)) {
	@apply my-0;
}

.note-body :global(:where(code)::before),
.note-body :global(:where(code)::after) {
	content: none;
}
</style>
