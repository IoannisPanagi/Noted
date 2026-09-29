import { get } from 'svelte/store';
import { createCollection } from '$lib/stores/collection.js';
import { api } from '$lib/utils/api.js';
import { socket } from '$lib/utils/socket.js';

// Built-in views that always wrap the workspace's own categories
const TODOS = { id: 1, label: 'to-dos', description: 'Things left to-do' };
const COMPLETED = {
	id: 2,
	label: 'completed',
	description: "I've completed these, I should be proud!",
};

function createCategoriesStore() {
	const store = createCollection();
	const { set, upsert, remove } = store;

	socket.on('category.created', upsert);
	socket.on('category.updated', upsert);
	socket.on('category.deleted', remove);

	return {
		subscribe: store.subscribe,

		loadCategories: async () => {
			try {
				socket.emit('list.categories', (res) => {
					if (res.ok) {
						set([TODOS, ...res.data, COMPLETED]);
					} else {
						set([TODOS, COMPLETED]);
					}
				});
			} catch (err) {
				set([TODOS, COMPLETED]);
				throw err;
			}
		},

		addCategory: async (category) => {
			const existing = get(store).find((c) => c.label === category.label);
			if (existing) return existing;

			socket.emit('add.category', { category }, (res) => {
				if (res.ok) {
					upsert(res.data);
				} else throw new Error('Failed to add new category');
			});
		},

		updateCategory: async (category) => {
			socket.emit('update.category', { category }, (res) => {
				if (res.ok) {
					upsert(res.data);
				}
			});
		},

		deleteCategory: async (id) => {
			socket.emit('delete.category', { id }, (res) => {
				if (res.ok) {
					remove(id);
				} else throw new Error('Failed to delete category');
			});
		},
	};
}

export const categories = createCategoriesStore();
