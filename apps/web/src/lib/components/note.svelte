<script module>
// One ResizeObserver shared by every note, instead of one each
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
import { noteButtons } from '$lib/utils/noteButtons.svelte.js';

// The menu, delete dialog and details popover live in note-grid.svelte, keeping each note cheap
let { note, category, hidden = false, editing = $bindable(false), ontoggle, ondelete, ondetails } = $props();

const notes = getNotes();

let editingText = $derived(editing ? note.text : '');
let editor = $state(null);
let isSavingEdit = false;

let html = $derived(renderMarkdown(note.text));

let expanded = $state(false);
let overflows = $state(false);

// Clamps a long note at the last line that fits. Card heights vary, so the line count is searched for
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

function handleCardClick(e) {
	if (!overflows || editing) return;
	if (e.target.closest('button, a')) return;
	if (!window.getSelection()?.isCollapsed) return;
	expanded = !expanded;
}

function toggleEditing() {
	if (editing) return handleEditCancel();
	editing = true;
}

// Only Enter saves; every exit goes through the blur, which decides whether to save
function handleEditSave() {
	isSavingEdit = true;
	editor.blur();
}

function handleEditCancel() {
	editor.blur();
}

function handleEditKeydown(e) {
	if (isPlainEnter(e)) {
		e.preventDefault();
		handleEditSave();
	}
	if (e.key === 'Escape') handleEditCancel();
}

async function handleEditBlur() {
	// The window lost focus, not the editor: it gets focus back with the window, so the edit is kept
	if (!document.hasFocus()) return;

	const text = editingText;
	const shouldSave = isSavingEdit && text.trim() && text !== note.text;
	isSavingEdit = false;
	editing = false;
	if (!shouldSave) return;

	try {
		await notes.update({ ...note, text });
		toast.success('Saved note');
	} catch {
		// The socket provider already toasted the error
	}
}
</script>

<!-- data-note-id lets the grid's shared context menu find the note -->
<div class="note-slot" data-note-id={note.id} {hidden}>
	<!-- The arrow button is the keyboard's way to expand -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class={['note', note.backgroundColor, overflows && !editing && 'is-expandable', expanded && 'is-expanded']}
		onclick={handleCardClick}
	>
		{#if noteButtons.active}
		<div class="note-toolbar">
			<Button
				variant="ghost"
				size="icon"
				class={['note-action note-action-complete', note.isCompleted && 'is-done']}
				aria-label={note.isCompleted ? 'Mark as not done' : 'Mark as done'}
				title="Mark note as completed or not"
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
				title="Edit note text"
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
				title="Delete note"
				onclick={() => ondelete(note)}
			>
				<Eraser />
			</Button>
		</div>
		{/if}
		{#if editing}
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
				<!-- Safe: renderMarkdown sanitises with DOMPurify -->
				<div class="note-text">{@html html}</div>
			</div>
		{/if}

		<div class="note-footer">
			{#if editing}
				<SaveHint onsave={handleEditSave} oncancel={handleEditCancel} />
			{:else}
				{#if category}
					<span class="note-category" title={category}>{category}</span>
				{/if}
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

/* Absolute, so an expanded note floats over the row below instead of stretching it */
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

.note-footer {
	@apply relative flex items-center justify-end pt-1;
}

.note-category {
	@apply me-auto min-w-0 flex-1 truncate px-1 text-base font-semibold;
}

/* Stops short of the centred expand arrow */
.note.is-expandable .note-category {
	@apply max-w-1/2 pe-5;
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

/* Notes stay pastel in dark mode, so their actions keep the note's ink */
.note :global(.save-hint-action) {
	@apply text-gray-900 hover:bg-black/5;
}

.note :global(.note-action) {
	@apply text-gray-900 hover:bg-black/5;
}

.note :global(.note-action svg) {
	@apply size-5;
}

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

/* Comic Neue has no medium weight; a hairline stroke keeps **bold** visibly bolder */
.note-font {
	font-family: "Comic Neue", cursive;
	font-weight: 400;
	-webkit-text-stroke: 0.35px currentColor;
}

.note-editor {
	@apply -mx-1 min-h-0 flex-1 overflow-y-auto rounded-md bg-white/50 px-2 py-1 leading-7 whitespace-pre-wrap wrap-break-word outline-none;
}

/* Notes stay light in dark mode, so prose follows the note's ink */
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

/* fitText's line clamp needs the vertical box */
.note-text {
	-webkit-box-orient: vertical;
	@apply overflow-hidden;
}

/* Prose only trims its direct children, without this a fitting note measures as too long */
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
