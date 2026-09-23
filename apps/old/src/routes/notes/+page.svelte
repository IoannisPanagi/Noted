<script>
import { Eraser, Pen, Plus } from '@lucide/svelte';
import { onMount } from 'svelte';
import { toast } from 'svelte-sonner';
import { page } from '$app/state';
import CategoryForm from '$lib/components/category-form.svelte';
import Loading from '$lib/components/loading.svelte';
import NotesMasonry from '$lib/components/note-masonry.svelte';
import NoteTopBar from '$lib/components/note-top-bar.svelte';
import Dialog from '$lib/components/noted-dialog.svelte';
import SseHandler from '$lib/components/sse-handler.svelte';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
} from '$lib/components/ui/alert-dialog/index.js';
import { Button } from '$lib/components/ui/button/index.js';
import { Label } from '$lib/components/ui/label/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';
import { Switch } from '$lib/components/ui/switch/index.js';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '$lib/components/ui/tabs/index.js';
import { categories } from '$lib/stores/categories.js';
import {
	readShowCompleted,
	setShowCompleted,
} from '$lib/utils/localStorage.js';
import { toTitleCase } from '$lib/utils.js';

let isLoading = $state(true);
let errors = $state(null);

onMount(async () => {
	try {
		await categories.loadCategories();
		currentCategoryId = $categories[0].id;
	} catch (e) {
		errors = e.message;
	} finally {
		isLoading = false;
	}
});

let currentCategoryId = $state(null);

let currentCategory = $derived(
	$categories.find((cat) => cat.id === currentCategoryId) ?? $categories[0],
);

let isDialogOpen = $state(false);
let isEditDialogOpen = $state(false);
let isDeleteAlertDialogOpen = $state(false);

let isDeletingCategory = $state(false);

function changeTab(category) {
	if (currentCategoryId === category.id) return;

	currentCategoryId = category.id;
}

async function handleDelete() {
	isDeletingCategory = true;
	try {
		toast.loading('Deleting...');
		await categories.deleteCategory(currentCategoryId);
		toast.success('Successfully deleted category');
	} catch (err) {
		toast.error(err.message);
	} finally {
		isDeletingCategory = false;
		isDeleteAlertDialogOpen = false;

		currentCategoryId = 1;
	}
}

let showCompleted = $state(readShowCompleted());

$effect(() => {
	setShowCompleted(showCompleted);
});

let workspace = $state(page.data.workspace);
</script>

<SseHandler bind:workspace={workspace} bind:currentCategoryId={currentCategoryId} {currentCategory} />
<div class="p-5">
	<NoteTopBar {workspace} {currentCategory} />

	<hr class="border border-gray-500 mb-5" />

	{#if isLoading}
		<Loading description="Loading categories..." />
	{:else if errors?.length > 0}
		<p class="text-red-600">{errors}</p>
	{:else}
		<Tabs value={currentCategory.label}>
			<TabsList class="bg-primary/10">
				{#each $categories.filter((category) => category.label !== 'completed') as category (category.id)}
					<TabsTrigger value={category.label}
											 onclick={() => changeTab(category)}>
						{toTitleCase(category.label)}
						{#if currentCategoryId === category.id && category.label !== 'to-dos'}
							<span class="ms-1">
								<Button size="icon" variant="ghost" class="text-blue-500" onclick={
									() => {isEditDialogOpen = !isEditDialogOpen}
								}><Pen /></Button>
								<Button size="icon" variant="ghost" class="text-red-500"
												onclick={() => {isDeleteAlertDialogOpen = !isDeleteAlertDialogOpen}}><Eraser /></Button>
							</span>
						{/if}
					</TabsTrigger>
				{/each}
				<Button class="hover:text-orange-400 transition-colors duration-200" onclick={() => {isDialogOpen=true}}
								variant="icon">
					<Plus />
				</Button>
				{#if isDialogOpen}
					<Dialog bind:open={isDialogOpen}
									noClose={true}
									title="Add new category"
									description="Add new category to keep your notes neatly sorted!">
						<CategoryForm bind:open={isDialogOpen} bind:currentCategoryId={currentCategoryId} />
					</Dialog>
				{/if}
				<TabsTrigger value='completed'
										 onclick={() => changeTab($categories.find((category) => category.label === 'completed'))}>
					Completed
				</TabsTrigger>
			</TabsList>
			<span class="flex items-center space-x-2">
				<Switch id="show-completed" bind:checked={showCompleted} />
				<Label for="show-completed" class="cursor-pointer">Show completed</Label>
			</span>
			<TabsContent value={currentCategory.label}>
				{#if currentCategory.description}
					<p class="text-primary/77 italic">{currentCategory.description}</p>
				{/if}
				<NotesMasonry {showCompleted} searchCategoryParam={currentCategory.label} />
			</TabsContent>
		</Tabs>
	{/if}
</div>

{#if isEditDialogOpen}
	<Dialog bind:open={isEditDialogOpen}
					noClose={true}
					title="Edit {currentCategory.label}"
					description="Add or edit the description">
		<CategoryForm bind:open={isEditDialogOpen} category={currentCategory} />
	</Dialog>
{/if}
{#if isDeleteAlertDialogOpen}
	<AlertDialog bind:open={isDeleteAlertDialogOpen}>
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
					disabled={isDeletingCategory}
				>
					{#if isDeletingCategory}
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
