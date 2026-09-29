import { get } from 'svelte/store';
import { createCollection } from '$lib/stores/collection.js';
import { api } from '$lib/utils/api.js';
import { socket } from '$lib/utils/socket.js';

const COLORS = [
	'bg-powder-blush',
	'bg-apricot-cream',
	'bg-cream',
	'bg-tea-green',
	'bg-electric-aqua',
	'bg-baby-blue-ice',
	'bg-periwinkle',
	'bg-mauve',
];

function randomBackgroundColor() {
	return COLORS[
		Math.floor(
			((Math.random() + Math.random() + Math.random()) % 1) * COLORS.length,
		)
	];
}

function createNotesStore() {
	const store = createCollection();
	const { set, upsert, remove, update } = store;

	// Socket listener for note changes on the API
	socket.on('note.created', upsert);
	socket.on('note.updated', upsert);
	socket.on('note.deleted', remove);
	socket.on('notes.cleared', () => {
		set([]);
	});

	// The server un-assigns a deleted category's notes without sending them again
	// For when you are in the general to-dos and the category disappears, so that you don't
	// Get errors where it goes "Category missing please fix"
	socket.on('category.deleted', (categoryId) =>
		update((notes) =>
			notes.map((note) =>
				note.categoryId === categoryId ? { ...note, categoryId: null } : note,
			),
		),
	);

	async function updateNote(note) {
		socket.emit('update.note', { note }, (res) => {
			if (res.ok) {
				// Update the store if response is okay.
				upsert(res.data);
			} else throw new Error(`Failed to update note`);
		});
	}

	return {
		subscribe: store.subscribe,
		updateNote,

		loadNotes: async (category) => {
			try {
				const { data } = await api.get('/notes', { params: { category } });
				set(data);
			} catch (err) {
				set([]);
				throw err;
			}
		},

		addNote: async (text, category) => {
			socket.emit(
				'add.note',
				{
					note: {
						text,
						backgroundColor: randomBackgroundColor(),
						noteOrder: get(store).length,
						categoryId: category ?? null,
					},
				},
				(res) => {
					if (res.ok) {
						upsert(res.data);
					} else throw new Error('Failed to add note');
				},
			);
		},

		toggleNoteComplete: async (id) => {
			const note = get(store).find((note) => note.id === id);
			if (!note) return;

			await updateNote({
				...note,
				isCompleted: !note.isCompleted,
				completedAt: note.isCompleted ? null : new Date().toISOString(),
			});
		},

		deleteNote: async (id) => {
			socket.emit(
				'delete.note',
				{
					id,
				},
				(res) => {
					if (res.ok) {
						remove(id);
					}
				},
			);
		},

		clearNotes: async () => {
			socket.emit('clear.notes', (res) => {
				if (res.ok) {
					set([]);
				}
			});
		},
	};
}

export const notes = createNotesStore();
