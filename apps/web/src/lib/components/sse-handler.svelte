<script>
import { source } from 'sveltekit-sse';
import { categories } from '$lib/stores/categories.js';
import { notes } from '$lib/stores/notes.js';

let {
	workspace = $bindable(),
	currentCategoryId = $bindable({}),
	currentCategory,
} = $props();

const connection = source('/api/sse');

let newNote = connection.select('newNote').json();
let updatedNote = connection.select('updateNote').json();
let deleteNoteId = connection.select('deleteNote').json();
let clearAllNotes = connection.select('clearAllNotes').json();

$effect(() => {
	if (
		$newNote &&
		($newNote.category === currentCategory.id ||
			currentCategory.label === 'to-dos')
	) {
		notes.addSSENote($newNote);
	}
});

$effect(() => {
	if ($updatedNote) {
		notes.updateSSENote($updatedNote);
	}
});

$effect(() => {
	if ($deleteNoteId) {
		notes.deleteSSENote($deleteNoteId);
	}
});

$effect(() => {
	if ($clearAllNotes) {
		notes.clearAllSSENotes();
	}
});

let newCategory = connection.select('newCategory').json();
let updatedCategory = connection.select('updateCategory').json();
let deleteCategoryId = connection.select('deleteCategory').json();

$effect(() => {
	if ($newCategory) {
		categories.addSSECategory($newCategory);
	}
});
$effect(() => {
	if ($updatedCategory) {
		categories.updateSSECategory($updatedCategory);
	}
});
$effect(() => {
	if ($deleteCategoryId) {
		categories.deleteSSECategory($deleteCategoryId);
	}

	if ($deleteCategoryId === currentCategoryId) {
		currentCategoryId = $categories[0];
	}
});

let sseWorkspace = connection.select('updateWorkspace').json();

$effect(() => {
	if ($sseWorkspace) {
		workspace = $sseWorkspace;
	}
});
</script>