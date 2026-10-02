// Lists of items keyed by id, always returned as new arrays so $state.raw
// notices. Upserting makes our own writes and the socket broadcasts of them land
// on the same entry, so nothing shows up twice

export function upsert(items, item) {
	return items.some((existing) => existing.id === item.id)
		? items.map((existing) => (existing.id === item.id ? item : existing))
		: [...items, item];
}

export function without(items, id) {
	return items.filter((item) => item.id !== id);
}
