// New arrays so $state.raw notices. Upserting lets our writes and their broadcasts land on the same entry

export function upsert(items, item) {
	return items.some((existing) => existing.id === item.id)
		? items.map((existing) => (existing.id === item.id ? item : existing))
		: [...items, item];
}

// Like upsert, but a new item goes to the front
export function prepend(items, item) {
	return items.some((existing) => existing.id === item.id)
		? upsert(items, item)
		: [item, ...items];
}

export function without(items, id) {
	return items.filter((item) => item.id !== id);
}
