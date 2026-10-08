<script>
import { LogOut, Paintbrush, PenLine } from '@lucide/svelte';
import { goto } from '@roxi/routify';
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
	AlertDialogTrigger,
} from '$lib/components/ui/alert-dialog/index.js';
import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupTextarea,
} from '$lib/components/ui/input-group/index.js';
import { getNotes } from '$lib/providers/notes-provider.svelte';
import { getWorkspace } from '$lib/providers/workspace-provider.svelte';
import { focusAction, focusAtEnd, isPlainEnter } from '$lib/utils.js';
import { api } from '$lib/utils/api.js';
import { removeActiveCategory } from '$lib/utils/localStorage.js';
import SaveHint from './save-hint.svelte';

// null is "All"
let { categoryId = null } = $props();

// Read during init: Routify's context is gone by the time a handler runs
const navigate = $goto;

const workspace = getWorkspace();
const notes = getNotes();

let newNoteText = $state('');

let description = $derived(workspace.current?.description ?? '');
let descriptionField;
let isSavingDescription = false;

let isClearOpen = $state(false);
let clearButton = $state(null);

async function handleNewNote(event) {
	event?.preventDefault();
	if (!newNoteText.trim()) return;

	try {
		await notes.add(newNoteText, categoryId);
		newNoteText = '';
		toast.success('Added note');
	} catch {
		// The socket provider already toasted the error
	}
}

function handleNewNoteKeydown(e) {
	if (isPlainEnter(e)) {
		handleNewNote(e);
	}
	if (e.key === 'Escape') e.currentTarget.blur();
}

// Only Enter saves; every exit goes through the blur, which decides whether to save
function handleDescriptionSave() {
	isSavingDescription = true;
	descriptionField.blur();
}

function handleDescriptionCancel() {
	descriptionField.blur();
}

function handleDescriptionKeydown(e) {
	if (isPlainEnter(e)) {
		e.preventDefault();
		handleDescriptionSave();
	}
	if (e.key === 'Escape') handleDescriptionCancel();
}

async function handleDescriptionBlur() {
	const saved = workspace.current?.description ?? '';
	const shouldSave = isSavingDescription && description !== saved;
	isSavingDescription = false;

	if (!shouldSave) {
		description = saved;
		return;
	}

	try {
		await workspace.update({ description, password: null });
		toast.success('Saved description');
	} catch {
		// The socket provider already toasted the error
	}
}

async function handleClearAll() {
	try {
		await notes.clear();
		toast.success('Cleared all notes');
	} catch {
		// The socket provider already toasted the error
	}
}

async function handleLeave() {
	try {
		await api.delete('/logout');
		removeActiveCategory();
		navigate('/', {}, { mode: 'replace' });
	} catch {
		// The socket provider already toasted the error
	}
}
</script>

<div class="top-bar">
	<div class="top-bar-heading">
		<h2 class="top-bar-title">{workspace.current?.passphrase}</h2>

		<div class="top-bar-description">
			<!-- Unlike a textarea, it wraps and grows with its content in every browser -->
			<p
				class="top-bar-description-text"
				contenteditable="plaintext-only"
				aria-multiline="true"
				aria-label="Workspace description"
				data-placeholder="Add a description..."
				bind:this={descriptionField}
				bind:textContent={description}
				onkeydown={handleDescriptionKeydown}
				onblur={handleDescriptionBlur}
			></p>

			<Button
				variant="ghost"
				size="icon-sm"
				class="top-bar-description-edit"
				aria-label="Edit description"
				onclick={() => focusAtEnd(descriptionField)}
			>
				<PenLine />
			</Button>

			<SaveHint class="top-bar-description-hint" onsave={handleDescriptionSave} oncancel={handleDescriptionCancel} />
		</div>
	</div>

	<div class="top-bar-compose">
		<form class="top-bar-compose-form" onsubmit={handleNewNote} novalidate>
			<InputGroup>
				<InputGroupTextarea
					class="top-bar-textarea"
					bind:value={newNoteText}
					onkeydown={handleNewNoteKeydown}
					placeholder="Write a note and press Enter (markdown works)"
				/>
				<InputGroupAddon align="block-end">
					<Button type="submit" class="top-bar-submit">Submit</Button>
				</InputGroupAddon>
			</InputGroup>
		</form>

		<div class="top-bar-actions">
			<AlertDialog bind:open={isClearOpen}>
				<AlertDialogTrigger class="{buttonVariants({ variant: 'destructive' })} btn-danger">
					<Paintbrush /> Clear all notes
				</AlertDialogTrigger>
				<AlertDialogContent onOpenAutoFocus={(e) => focusAction(e, clearButton)}>
					<AlertDialogHeader>
						<AlertDialogTitle>Clear all notes?</AlertDialogTitle>
						<AlertDialogDescription>
							This will clear every note in this workspace. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<SaveHint
							class="dialog-hint"
							action="clear"
							onsave={() => clearButton.click()}
							oncancel={() => (isClearOpen = false)}
						/>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction bind:ref={clearButton} class="btn-danger dialog-action" onclick={handleClearAll}>
							Clear all
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<Button variant="outline" onclick={handleLeave}><LogOut /> Leave workspace</Button>
		</div>
	</div>
</div>

<style>
@reference "../../app.css";

.top-bar {
	@apply mb-10 flex flex-col gap-4;
}

.top-bar-heading {
	@apply flex min-w-0 flex-col gap-1;
}

.top-bar-title {
	@apply truncate text-2xl font-bold;
}

.top-bar-description {
	@apply flex items-start gap-2 text-muted-foreground;
}

.top-bar-description-text {
	@apply -mx-1 max-w-2xl min-w-12 cursor-text rounded-md px-1 leading-6 whitespace-pre-wrap outline-none focus:bg-(--folder) focus:text-foreground;
}

.top-bar-description-text:empty::before {
	@apply text-muted-foreground/70;
	content: attr(data-placeholder);
}

.top-bar-description :global(.top-bar-description-edit) {
	@apply size-6;
}

/* While editing, the pencil makes way for the key hint */
.top-bar-description :global(.top-bar-description-hint) {
	@apply hidden;
}

.top-bar-description:focus-within :global(.top-bar-description-hint) {
	@apply flex;
}

.top-bar-description:focus-within :global(.top-bar-description-edit) {
	@apply hidden;
}

.top-bar-compose {
	@apply flex items-end justify-between gap-4;
}

.top-bar-compose-form {
	@apply w-full lg:w-1/2;
}

.top-bar-compose-form :global(.top-bar-textarea) {
	@apply min-h-16;
}

.top-bar-compose-form :global(.top-bar-submit) {
	@apply ms-auto px-6;
}

/* Kept apart from Submit so Clear all is never a misclick away */
.top-bar-actions {
	@apply flex shrink-0 gap-2;
}
</style>
