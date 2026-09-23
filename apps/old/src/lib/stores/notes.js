import { writable } from 'svelte/store';
import { api } from '$lib/utils/api.js';

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
	const { subscribe, set, update } = writable([]);

	return {
		subscribe,

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
			let currentLength = 0;
			update((notes) => {
				currentLength = notes.length;
				return notes;
			});

			const newNote = {
				text,
				backgroundColor: randomBackgroundColor(),
				isCompleted: false,
				createdAt: new Date().toISOString(),
				completedAt: null,
				category: category,
				order: currentLength,
			};

			const { data } = await api.post('/notes', newNote);

			update((notes) => {
				if (notes.find((existingNote) => existingNote.id === data.id)) {
					return notes;
				}

				return [...notes, data];
			});
		},

		editNote: async (note) => {
			const { data } = await api.put(`/notes/${note.id}`, note);

			update((notes) =>
				notes.map((oldNote) => (oldNote.id === note.id ? data : oldNote)),
			);
		},

		toggleNoteComplete: async (id) => {
			let noteToUpdate = null;
			update((notes) => {
				noteToUpdate = notes.find((note) => note.id === id);
				return notes;
			});

			if (!noteToUpdate) {
				return;
			}

			const updatedNote = {
				...noteToUpdate,
				isCompleted: !noteToUpdate.isCompleted,
				completedAt: !noteToUpdate.isCompleted
					? new Date().toISOString()
					: null,
			};

			const { data } = await api.put(`/notes/${id}`, updatedNote);

			update((notes) => notes.map((note) => (note.id === id ? data : note)));
		},

		deleteNote: async (id) => {
			await api.delete(`/notes/${id}`);

			update((notes) => notes.filter((note) => note.id !== id));
		},

		clearAll: async () => {
			await api.delete(`/notes`);

			update(() => []);
		},

		addSSENote: (note) => {
			update((notes) => {
				if (notes.find((existingNote) => existingNote.id === note.id)) {
					return notes;
				}

				return [...notes, note];
			});
		},

		updateSSENote(note) {
			update((notes) => {
				return notes.map((existingNote) =>
					existingNote.id === note.id ? note : existingNote,
				);
			});
		},

		deleteSSENote(id) {
			update((notes) => {
				if (!notes.find((existingNote) => existingNote.id === id)) {
					return notes;
				}

				return notes.filter((existingNote) => existingNote.id !== id);
			});
		},

		clearAllSSENotes() {
			update(() => []);
		},
	};
}

export const notes = createNotesStore();
