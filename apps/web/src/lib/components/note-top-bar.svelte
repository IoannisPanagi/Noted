<script>
import { LogOut, Paintbrush, PenLine } from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { goto, invalidateAll } from '$app/navigation';
import { resolve } from '$app/paths';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTrigger,
} from '$lib/components/ui/alert-dialog/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	Textarea,
} from '$lib/components/ui/input-group/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';
import { notes } from '$lib/stores/notes.js';
import { api } from '$lib/utils/api.js';

let newNoteText = $state('');

let { currentCategory, workspace } = $props();

let isDialogOpen = $state(false);
let isDeleting = $state(false);

let isEditingDescription = $state(false);
let isSavingDescription = $state(false);

let description = $derived(workspace.description);
let password = $state(null);

async function handleNewNote(event) {
	event?.preventDefault();

	try {
		if (newNoteText.trim()) {
			toast.loading('Saving note...');
			await notes.addNote(newNoteText, currentCategory.id);
			toast.success('Saved note');
			newNoteText = '';
		}
	} catch (err) {
		toast.error(err.message);
	}
}

async function handleClearAll() {
	isDialogOpen = true;
	isDeleting = true;
	try {
		toast.loading('Clearing all notes...');
		await notes.clearAll();
		toast.success('Successfully cleared all notes');
	} catch (err) {
		toast.error(err.message);
	} finally {
		isDialogOpen = false;
		isDeleting = false;
	}
}

function handleKeyDown(e) {
	if (
		e.key === 'Enter' &&
		!e.shiftKey &&
		!e.ctrlKey &&
		!e.altKey &&
		!e.metaKey
	) {
		handleNewNote();
	}
}

async function handleWorkspaceSave() {
	isSavingDescription = true;
	try {
		toast.loading('Saving the workspace...');
		const response = await api.post('/workspaces', {
			description: description,
			password: password,
		});

		workspace.description = response.data.description;

		isEditingDescription = false;
		toast.success('Saved the workspace');
	} catch (err) {
		toast.error(err.message);
	} finally {
		isSavingDescription = false;
	}
}

async function handleLeaveWorkspace() {
	try {
		await api.delete('/auth');

		await invalidateAll();

		await goto(resolve('/'));
	} catch (err) {
		toast.error(err.message);
	}
}
</script>

<div class="flex flex-col gap-2 justify-center mb-5">
	<h2 class="font-bold text-2xl">Current workspace: {workspace.passphrase}</h2>
	<div class="lg:w-1/3 md:w-1/2 w-full">
		<div class="flex flex-row gap-2">
			{#if isEditingDescription}
				<div class="flex flex-row gap-2 w-full">
					{#if isSavingDescription}
					<span>
						<Spinner />
						Saving...
					</span>
					{:else}
						<form class="w-full" onsubmit={handleWorkspaceSave} novalidate>
							<InputGroup>
								<Textarea
									onkeydown={
										(e) => {
											if(e.key === 'Escape') {
												isEditingDescription = false;
												description = workspace.description;
											}
										}
									}
									autosize="true"
									class="flex field-sizing-content min-h-20 resize-none"
									bind:value={description}
									placeholder="Write a description..." />
								<InputGroupAddon align="block-end">
									<InputGroupButton class="ms-auto" type="cancel" size="sm" variant="destructive"
																		onclick={() => {
									isEditingDescription = false;
									description = workspace.description;
								}}>Cancel
									</InputGroupButton>
									<InputGroupButton type="submit" size="sm" variant="secondary">Save</InputGroupButton>
								</InputGroupAddon>
							</InputGroup>
						</form>
					{/if}
				</div>
			{:else}
				<p class="max-w-fit w-fit">
					{workspace.description ?? "No description found add a new one!"}
				</p>
				<button
					class="dark:text-green-200 text-blue-600"
					onclick={() => {isEditingDescription=!isEditingDescription}}>
					<PenLine class="w-4" />
				</button>
			{/if}
		</div>
		<h3>Write and press enter to add a new note</h3>
		<form onsubmit={handleNewNote} noValidate>
			<InputGroup>
			<textarea
				class="field-sizing-content flex min-h-16 w-full md:resize-y resize-none rounded-md bg-transparent px-3 py-2.5 text-base outline-none transition-[color,box-shadow] md:text-sm"
				data-slot="input-group-control"
				bind:value={newNoteText}
				onkeydown={handleKeyDown}
				placeholder="What would you like to do?"
			></textarea>
				<InputGroupAddon align="block-end">
					<InputGroupButton class="ms-auto" type="submit" variant="default">Submit</InputGroupButton>
				</InputGroupAddon>
			</InputGroup>
		</form>
	</div>


	<div class="flex justify-between md:mt-0 mt-3">
		<div class="flex gap-2 ms-auto">
			<AlertDialog bind:open={isDialogOpen}>
				<AlertDialogTrigger
					class="cursor-pointer bg-red-700 hover:bg-red-800 transition-colors p-1 px-10 rounded-xl text-white"
				>
					<div class="flex flex-row items-center gap-2">
						<Paintbrush size={16} />
						Clear All Notes
					</div>
				</AlertDialogTrigger>
				<AlertDialogContent
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							handleClearAll();
						}
					}}
				>
					<AlertDialogHeader>Are you sure?</AlertDialogHeader>
					<AlertDialogDescription>This will clear all notes from the current <u>workspace</u><br/>This action cannot be undone</AlertDialogDescription>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							class="bg-red-700 hover:bg-red-800 transition-colors"
							onclick={handleClearAll}
							disabled={isDeleting}
						>
							{#if isDeleting}
								<Spinner size="icon" />
								Processing
							{:else}
								<span class="text-white">Confirm</span>
							{/if}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<Button onclick={handleLeaveWorkspace} class="flex flex-row gap-2 items-center px-10">
				<LogOut size={16} />
				Leave workspace
			</Button>
		</div>
	</div>
</div>
