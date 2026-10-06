<script>
import { ChevronDown, Eraser, PenLine, Plus } from '@lucide/svelte';
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
import { Button } from '$lib/components/ui/button/index.js';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '$lib/components/ui/context-menu/index.js';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '$lib/components/ui/dialog/index.js';
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '$lib/components/ui/field/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { Label } from '$lib/components/ui/label/index.js';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '$lib/components/ui/popover/index.js';
import { Separator } from '$lib/components/ui/separator/index.js';
import { Switch } from '$lib/components/ui/switch/index.js';
import { Textarea } from '$lib/components/ui/textarea/index.js';
import { getCategories } from '$lib/providers/categories-provider.svelte';
import { focusAction, isPlainEnter, toTitleCase } from '$lib/utils.js';
import SaveHint from './save-hint.svelte';

let { showCompleted = $bindable(false), children } = $props();

const categories = getCategories();

const ALL = { id: null, label: 'all', description: 'Every note in this workspace' };

let folders = $derived([ALL, ...categories.list]);
let active = $derived(folders.find((folder) => folder.id === categories.activeId) ?? ALL);

let isMoreOpen = $state(false);

// CSS can't shrink a wrapped row to its first line, so the list is sized to the last tab that fits.
// Unrounded positions, since offsetWidth rounding could push the last tab off
let innerWidth = $state(0);
let fontsLoaded = $state(false);

document.fonts.ready.then(() => (fontsLoaded = true));

// Reads everything that changes which tabs fit (bold active tab is wider)
function fitTabList(tabList) {
	[innerWidth, fontsLoaded, folders, active, isMoreOpen];
	tabList.style.width = '';

	const listBox = tabList.getBoundingClientRect();
	const tabBoxes = [...tabList.children]
		.map((tab) => tab.getBoundingClientRect())
		// Tabs hidden on smaller screens have no size; wrapped ones sit below the first line
		.filter((box) => box.width > 0 && box.top < listBox.top + box.height / 2);

	const lastRight = Math.max(...tabBoxes.map((box) => box.right));
	tabList.style.width = `${Math.ceil(lastRight - listBox.left)}px`;
}

let isFormOpen = $state(false);
// Raw, as a deep $state copy would never equal its folder (see labelError)
let editing = $state.raw(null);
let formLabel = $state('');
let formDescription = $state('');
let wasSubmitted = $state(false);
let form;

// Labels are stored lowercase. An empty label only complains once saving was tried
let labelError = $derived.by(() => {
	const label = formLabel.trim().toLowerCase();
	if (!label) return wasSubmitted ? 'Give the category a label' : null;
	if (folders.some((folder) => folder !== editing && folder.label === label))
		return `There's already a category called "${toTitleCase(label)}"`;
	return null;
});

let deleteTarget = $state.raw(null);
let isDeleteOpen = $state(false);
let deleteButton = $state(null);

function open(folder) {
	categories.select(folder.id);
	isMoreOpen = false;
}

function openForm(category = null) {
	editing = category;
	formLabel = category?.label ?? '';
	formDescription = category?.description ?? '';
	wasSubmitted = false;
	isFormOpen = true;
}

async function handleFormSubmit(event) {
	event.preventDefault();
	wasSubmitted = true;
	if (!formLabel.trim() || labelError) return;

	try {
		if (editing) {
			await categories.update({ id: editing.id, label: formLabel, description: formDescription });
			toast.success(`Saved ${toTitleCase(formLabel.trim())}`);
		} else {
			await categories.add({ label: formLabel, description: formDescription });
			toast.success(`Created ${toTitleCase(formLabel.trim())}`);
		}
		isFormOpen = false;
	} catch {
		// The socket provider already toasted the error
	}
}

function confirmDelete(category) {
	deleteTarget = category;
	isDeleteOpen = true;
}

function handleDescriptionKeydown(e) {
	if (!isPlainEnter(e)) return;
	e.preventDefault();
	e.currentTarget.form.requestSubmit();
}

async function handleDelete() {
	try {
		await categories.remove(deleteTarget.id);
		toast.success(`Deleted ${toTitleCase(deleteTarget.label)}`);
	} catch {
		// The socket provider already toasted the error
	} finally {
		isDeleteOpen = false;
	}
}
</script>

<svelte:window bind:innerWidth />

<div>
	<div class="folder-tabs">
		<div class="folder-tab-list" {@attach fitTabList}>
			{#each folders as folder (folder.id)}
				<!-- The tab is the trigger itself, so no wrapper lands in the list -->
				<ContextMenu>
					<ContextMenuTrigger>
						{#snippet child({ props })}
							<button
								{...props}
								class={['folder-tab', folder === active && !isMoreOpen && 'is-active']}
								title={toTitleCase(folder.label)}
								onclick={() => open(folder)}
							>
								<span class="folder-tab-label">{toTitleCase(folder.label)}</span>
							</button>
						{/snippet}
					</ContextMenuTrigger>
					{@render categoryMenu(folder)}
				</ContextMenu>
			{/each}
		</div>

		<button class="folder-tab" aria-label="New category" title="New category" onclick={() => openForm()}>
			<Plus />
		</button>

		<Popover bind:open={isMoreOpen}>
			<PopoverTrigger class={['folder-tab folder-tab-more', isMoreOpen && 'is-active']}>
				More <ChevronDown />
			</PopoverTrigger>
			<PopoverContent align="start" sideOffset={0} class="folder-menu">
				{#each folders as folder (folder.id)}
					<ContextMenu>
						<ContextMenuTrigger>
							{#snippet child({ props })}
								<Button
									{...props}
									size="sm"
									variant={folder === active ? 'secondary' : 'ghost'}
									class="folder-menu-item"
									title={toTitleCase(folder.label)}
									onclick={() => open(folder)}
								>
									<span class="folder-tab-label">{toTitleCase(folder.label)}</span>
								</Button>
							{/snippet}
						</ContextMenuTrigger>
						{@render categoryMenu(folder)}
					</ContextMenu>
				{/each}
			</PopoverContent>
		</Popover>
	</div>

	<div class="folder-body">
		<div class="folder-header">
			<p class="folder-description">{active.description ?? 'No description'}</p>

			<div class="folder-controls">
				<Label class="folder-toggle">
					<Switch bind:checked={showCompleted} /> Show completed
				</Label>

				{#if active !== ALL}
					<Separator orientation="vertical" class="folder-divider" />
					<div class="folder-category-actions">
						<Button variant="ghost" size="icon-sm" aria-label="Edit category" onclick={() => openForm(active)}>
							<PenLine />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							class="folder-category-delete"
							aria-label="Delete category"
							onclick={() => confirmDelete(active)}
						>
							<Eraser />
						</Button>
					</div>
				{/if}
			</div>
		</div>

		{@render children()}
	</div>
</div>

{#snippet categoryMenu(folder)}
	<ContextMenuContent>
		<ContextMenuItem onSelect={() => openForm()}>
			<Plus /> New category
		</ContextMenuItem>
		{#if folder !== ALL}
			<ContextMenuSeparator />
			<ContextMenuItem onSelect={() => openForm(folder)}>
				<PenLine /> Edit category
			</ContextMenuItem>
			<ContextMenuItem variant="destructive" onSelect={() => confirmDelete(folder)}>
				<Eraser /> Delete category
			</ContextMenuItem>
		{/if}
	</ContextMenuContent>
{/snippet}

<Dialog bind:open={isFormOpen}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{editing ? `Edit ${toTitleCase(editing.label)}` : 'New category'}</DialogTitle>
			<DialogDescription>Categories are the folders your notes are sorted into.</DialogDescription>
		</DialogHeader>
		<form class="category-form" bind:this={form} onsubmit={handleFormSubmit} novalidate>
			<FieldGroup>
				<Field data-invalid={labelError ? true : undefined}>
					<FieldLabel for="category-label">Label</FieldLabel>
					<Input
						id="category-label"
						placeholder="e.g. Homework"
						bind:value={formLabel}
						aria-invalid={labelError ? true : undefined}
						autofocus
					/>
					{#if labelError}
						<FieldError>{labelError}</FieldError>
					{:else}
						<FieldDescription>
							Shown on the tab as "{toTitleCase(formLabel.trim() || 'homework')}"
						</FieldDescription>
					{/if}
				</Field>

				<Field>
					<FieldLabel for="category-description">
						Description <span class="category-form-optional">(optional)</span>
					</FieldLabel>
					<Textarea
						id="category-description"
						class="category-form-description"
						placeholder="e.g. What's due this week"
						bind:value={formDescription}
						onkeydown={handleDescriptionKeydown}
					/>
					<FieldDescription>Shown inside the folder, above its notes. Shift+Enter for a new line</FieldDescription>
				</Field>
			</FieldGroup>

			<DialogFooter>
				<SaveHint
					class="dialog-hint"
					action={editing ? 'save' : 'create'}
					onsave={() => form.requestSubmit()}
					oncancel={() => (isFormOpen = false)}
				/>
				<Button type="button" variant="outline" onclick={() => (isFormOpen = false)}>Cancel</Button>
				<Button type="submit" disabled={!!labelError}>{editing ? 'Save' : 'Create'}</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>

<AlertDialog bind:open={isDeleteOpen}>
	<AlertDialogContent onOpenAutoFocus={(e) => focusAction(e, deleteButton)}>
		<AlertDialogHeader>
			<AlertDialogTitle>Delete "{toTitleCase(deleteTarget?.label ?? '')}"?</AlertDialogTitle>
			<AlertDialogDescription>Its notes are kept and move to "All".</AlertDialogDescription>
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

.folder-tabs {
	@apply flex w-fit overflow-hidden rounded-t-lg bg-(--folder-tab);
}

.folder-tabs :global(.folder-tab) {
	@apply flex h-9 shrink-0 cursor-pointer items-center bg-(--folder-tab) px-4 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground;
}

.folder-tabs :global(.folder-tab.is-active) {
	@apply bg-(--folder) font-semibold text-foreground;
}

.folder-tabs :global(.folder-tab svg) {
	@apply size-4;
}

.folder-tab-label {
	@apply max-w-40 truncate;
}

/* Overflowing tabs wrap onto a hidden second line; small screens show a fixed 4, then 3 */
.folder-tab-list {
	@apply relative flex h-9 min-w-0 flex-wrap overflow-hidden lg:max-w-[calc(50vw-2rem)];
}

.folder-tab-list > .folder-tab:nth-child(n + 5) {
	@apply max-lg:hidden;
}

.folder-tab-list > .folder-tab:nth-child(n + 4) {
	@apply max-md:hidden;
}

.folder-tabs :global(.folder-tab-more) {
	@apply gap-1;
}

.folder-tabs :global(.folder-tab-more.is-active svg) {
	@apply rotate-180;
}

/* Cut from the folder: same colour, square corner where it meets the tab */
:global(.folder-menu) {
	@apply flex max-h-80 w-56 flex-col gap-0.5 overflow-y-auto rounded-md rounded-tl-none border-none bg-(--folder) p-1 shadow-md;
}

:global(.folder-menu .folder-menu-item) {
	@apply justify-start;
}

.folder-body {
	@apply flex flex-col gap-4 rounded-tr-lg rounded-b-lg bg-(--folder) p-4 shadow-sm;
}

/* Fixed height so the notes don't jump when the category buttons appear */
.folder-header {
	@apply flex min-h-8 items-center justify-between gap-4;
}

.folder-description {
	@apply min-w-0 truncate text-sm text-muted-foreground;
}

.folder-controls {
	@apply flex shrink-0 items-center gap-3;
}

.folder-controls :global(.folder-toggle) {
	@apply flex items-center gap-2 text-sm text-muted-foreground;
}

.folder-controls :global(.folder-divider) {
	@apply bg-(--rich-marine) data-[orientation=vertical]:h-5;
}

.folder-category-actions {
	@apply flex items-center gap-1;
}

.folder-category-actions :global(.folder-category-delete) {
	@apply hover:text-destructive;
}

.category-form {
	@apply flex flex-col gap-6;
}

.category-form-optional {
	@apply font-normal text-muted-foreground;
}

.category-form :global(.category-form-description) {
	@apply min-h-20 resize-none;
}
</style>
