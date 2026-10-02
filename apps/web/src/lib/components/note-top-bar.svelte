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
import './styles/top-bar.css';

// The category new notes go into; null is "All"
let { categoryId = null } = $props();

// Read during init: Routify's context is gone by the time a handler runs
const navigate = $goto;

const workspace = getWorkspace();
const notes = getNotes();

let newNoteText = $state('');

// Edited in place: follows the saved description, and typing overrides it until
// it's saved or thrown away
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
		// Refused: the socket provider has already toasted why
	}
}

function handleNewNoteKeydown(e) {
	if (isPlainEnter(e)) {
		handleNewNote(e);
	}
	if (e.key === 'Escape') e.currentTarget.blur();
}

// Only Enter (or its hint button) saves. Esc or clicking away leave the field
// too, but put the saved text back. Every exit goes through the blur, which is
// where that's decided
function saveDescriptionEdit() {
	isSavingDescription = true;
	descriptionField.blur();
}

function cancelDescriptionEdit() {
	descriptionField.blur();
}

function handleDescriptionKeydown(e) {
	if (isPlainEnter(e)) {
		e.preventDefault();
		saveDescriptionEdit();
	}
	if (e.key === 'Escape') cancelDescriptionEdit();
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
		// Refused: the socket provider has already toasted why
	}
}

async function handleClearAll() {
	try {
		await notes.clear();
		toast.success('Cleared all notes');
	} catch {
		// Refused: the socket provider has already toasted why
	}
}

async function handleLeave() {
	try {
		await api.delete('/logout');
		removeActiveCategory();
		navigate('/', {}, { mode: 'replace' });
	} catch {
		// Refused: the socket provider has already toasted why
	}
}
</script>

<div class="top-bar">
	<div class="top-bar-heading">
		<h2 class="top-bar-title">{workspace.current?.passphrase}</h2>

		<div class="top-bar-description">
			<!-- Editable text rather than a textarea: it wraps and grows with its
			     content in every browser, and looks the same editing or not -->
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

			<!-- Only visible while editing (see top-bar.css) -->
			<SaveHint class="top-bar-description-hint" onsave={saveDescriptionEdit} oncancel={cancelDescriptionEdit} />
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
