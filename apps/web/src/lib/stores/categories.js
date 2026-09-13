import { writable } from 'svelte/store';
import { api } from '$lib/utils/api.js';

function createCategoriesStore() {
	const { subscribe, set, update } = writable([]);

	return {
		subscribe,

		loadCategories: async () => {
			try {
				const { data } = await api.get('/categories');
				set([
					{ id: 1, label: 'to-dos', description: 'Things left to-do' },
					...data,
					{
						id: 2,
						label: 'completed',
						description: "I've completed these, I should be proud!",
					},
				]);
			} catch (err) {
				set([
					{ id: 1, label: 'to-dos', description: 'Things left to-do' },
					{
						id: 2,
						label: 'completed',
						description: "I've completed these, I should be proud!",
					},
				]);
				throw err;
			}
		},

		addCategory: async (category) => {
			let existingCategory = null;
			update((categories) => {
				existingCategory = categories.filter((c) => c.label === category.label);
				return categories;
			});

			if (existingCategory.length > 0) return existingCategory;

			const { data } = await api.post('/categories', category);

			update((categories) => {
				if (
					categories.find((existingCategory) => existingCategory.id === data.id)
				)
					return categories;

				return [...categories, data];
			});

			return data;
		},

		editCategory: async (category) => {
			const { data } = await api.put(`/categories/${category.id}`, category);

			update((categories) =>
				categories.map((oldCategory) =>
					oldCategory.id === category.id ? data : oldCategory,
				),
			);

			return data;
		},

		deleteCategory: async (id) => {
			await api.delete(`/categories/${id}`);

			update((categories) =>
				categories.filter((category) => category.id !== id),
			);
		},

		addSSECategory: (category) => {
			update((categories) => {
				if (
					categories.find(
						(existingCategory) => existingCategory.id === category.id,
					)
				)
					return categories;

				return [...categories, category];
			});
		},

		updateSSECategory(category) {
			update((categories) =>
				categories.map((oldCategory) =>
					oldCategory.id === category.id ? category : oldCategory,
				),
			);
		},

		deleteSSECategory: (id) => {
			update((categories) =>
				categories.filter((category) => category.id !== id),
			);
		},
	};
}

export const categories = createCategoriesStore();
