<script>
import {
	CircleCheck,
	Eraser,
	InfoIcon,
	Pen,
	Square,
	SquareCheck,
} from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
} from '$lib/components/ui/alert-dialog/index.js';
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
} from '$lib/components/ui/card/index.js';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	Textarea,
} from '$lib/components/ui/input-group/index.js';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '$lib/components/ui/popover/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';
import { notes } from '$lib/stores/notes.js';

let { note } = $props();

let isEditing = $state(false);
let isDeleting = $state(false);
let isChecking = $state(false);
let editingNoteText = $derived(note.text);

let isDeletingAlertOpen = $state(false);

async function handleMarkComplete() {
	isChecking = true;
	try {
		if (!note.isCompleted) {
			toast.loading('Marking the note as complete');
		} else toast.loading('Unmarking the note as complete');

		await notes.toggleNoteComplete(note.id);

		if (note.isCompleted) {
			toast.success('Marked the note as completed');
		} else toast.success('Unmarked the note as complete');
	} catch (err) {
		toast.error(err.message);
	} finally {
		isChecking = false;
	}
}

async function handleEditNote() {
	try {
		note.text = editingNoteText;
		toast.loading('Editing...');
		await notes.editNote(note);
		toast.success('Successfully saved note');
	} catch (err) {
		toast.error(err.message);
	} finally {
		isEditing = false;
	}
}

async function handleDelete() {
	isDeleting = true;
	try {
		toast.loading('Deleting...');
		await notes.deleteNote(note.id);
		toast.success('Successfully deleted note');
	} catch (err) {
		toast.error(err.message);
	} finally {
		isDeleting = false;
	}
}

function handleToggleEdit() {
	isEditing = !isEditing;
}

function handleKeyDown(e) {
	if (
		e.key === 'Enter' &&
		!e.shiftKey &&
		!e.ctrlKey &&
		!e.altKey &&
		!e.metaKey
	) {
		e.preventDefault();
		handleEditNote();
	}
	if (e.key === 'Escape') {
		e.preventDefault();
		editingNoteText = note.text;
		isEditing = false;
	}
}

function formatDate(isoString) {
	return new Date(isoString).toLocaleDateString('en-AU');
}
</script>

<Card class="aspect-square fade-in text-gray-900 {note.backgroundColor}">
	<CardHeader>
		<CardAction>
			<div class="flex flex-row gap-2 items-center">
				{#if isChecking}
					<Spinner class="cursor-not-allowed size-6 text-[#03C03C]" />
				{:else if note.isCompleted}
					<SquareCheck class="cursor-pointer text-[#03C03C]" onclick={handleMarkComplete} />
				{:else}
					<Square class="cursor-pointer hover:text-[#03C03C] transition-colors" onclick={handleMarkComplete} />
				{/if}

				<Pen
					class="cursor-pointer p-0.5 {isEditing === true ? `text-blue-600` : ``} hover:text-sky-600 transition-colors"
					size={25} onclick={handleToggleEdit} />
				<button onclick={() => {isDeletingAlertOpen = !isDeletingAlertOpen}}>
					<Eraser class="cursor-pointer p-0.5 hover:text-red-500 transition-colors" size={25} />
				</button>
				{#if isDeletingAlertOpen}
					<AlertDialog bind:open={isDeletingAlertOpen}>
						<AlertDialogContent
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									handleDelete();
								}}}>
							<AlertDialogHeader>Are you sure?</AlertDialogHeader>
							<AlertDialogDescription>This action cannot be undone</AlertDialogDescription>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									class="bg-red-600 hover:bg-red-700 text-white transition-colors"
									onclick={handleDelete}
									disabled={isDeleting}
								>
									{#if isDeleting}
										<Spinner size="icon" />
										Processing
									{:else}
										Confirm
									{/if}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				{/if}
			</div>
		</CardAction>
	</CardHeader>
	<CardContent>
		{#if isEditing}
			<form onsubmit={handleEditNote} class="w-full" noValidate>
				<InputGroup class="bg-white/70 dark:bg-white/70">
					<Textarea
						class="field-sizing-content bg-white flex min-h-20 w-full resize-none rounded-md px-3 py-2.5 text-base outline-none transition-[color,box-shadow] md:text-sm"
						data-slot="input-group-control"
						autosize={true}
						bind:value={editingNoteText}
						onkeydown={handleKeyDown}
						placeholder="What would you like to do?"
					></Textarea>
					<InputGroupAddon align="block-end">
						<InputGroupButton class="ms-auto" type="submit" variant="default">Submit</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			</form>
		{:else}
			<p class:line-through={note.isCompleted} class="wrap-break-word whitespace-pre-wrap">{note.text}</p>
		{/if}
	</CardContent>
	<CardFooter class="flex flex-col gap-1 mt-auto">
		<Popover>
			<PopoverTrigger class="ms-auto">
				{#if note.isCompleted}
					<CircleCheck />
				{:else}
					<InfoIcon />
				{/if}
			</PopoverTrigger>
			<PopoverContent>
				Created on: {formatDate(note.createdAt)} <br />
				{#if note.isCompleted}
					Completed on: {formatDate(note.completedAt)}
				{/if}
			</PopoverContent>
		</Popover>
	</CardFooter>
</Card>