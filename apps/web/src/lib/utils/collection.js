// New arrays so $state.raw notices. Upserting lets our writes and their broadcasts land on the same entry

export function upsert(items, item) {
	return items.some((existing) => existing.id === item.id)
		? items.map((existing) => (existing.id === item.id ? item : existing))
		: [...items, item];
}

export function without(items, id) {
	return items.filter((item) => item.id !== id);
}
