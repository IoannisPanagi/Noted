import { writable } from 'svelte/store';

// A list of items keyed by id. Upserting makes our own writes and the socket
// broadcasts of them land on the same entry, so nothing shows up twice.
// Expanded writable collection
export function createCollection() {
	const { subscribe, set, update } = writable([]);

	return {
		subscribe,
		set,
		update,

		// Upserting existing items when a newer one comes in
		upsert: (item) =>
			update((items) =>
				items.some((existing) => existing.id === item.id)
					? items.map((existing) => (existing.id === item.id ? item : existing))
					: [...items, item],
			),

		// Removing an item out of the collection
		remove: (id) => update((items) => items.filter((item) => item.id !== id)),
	};
}
