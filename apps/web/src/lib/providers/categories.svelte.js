import { upsert, without } from '$lib/utils/collection.js';
import { readActiveCategory, setActiveCategory } from '$lib/utils/localStorage.js';

export class Categories {
	list = $state.raw([]);
	loading = $state(true);
	error = $state.raw(null);

	// A pick that no longer exists (deleted, or another workspace's) opens "All" without resetting the pick
	selectedId = $state(readActiveCategory() ?? null);
	activeId = $derived(this.list.some((category) => category.id === this.selectedId) ? this.selectedId : null);

	#socket;
	#listeners = {
		// Reloads on every reconnect to catch what was missed
		connect: () => this.load(),
		'category.created': (category) => (this.list = upsert(this.list, category)),
		'category.updated': (category) => (this.list = upsert(this.list, category)),
		'category.deleted': (id) => (this.list = without(this.list, id)),
	};

	constructor(socket) {
		this.#socket = socket;
		for (const [event, handler] of Object.entries(this.#listeners)) socket.on(event, handler);
	}

	async load() {
		try {
			this.list = await this.#socket.emitWithAck('list.categories');
			this.error = null;
		} catch (err) {
			this.error = err;
		} finally {
			this.loading = false;
		}
	}

	select(id) {
		this.selectedId = id;
		setActiveCategory(id);
	}

	// Refusals are never acknowledged, so the await times out into the caller's catch
	async add(category) {
		const saved = await this.#socket.emitWithAck('add.category', { category });
		this.list = upsert(this.list, saved);
	}

	async update(category) {
		const saved = await this.#socket.emitWithAck('update.category', { category });
		this.list = upsert(this.list, saved);
	}

	async remove(id) {
		await this.#socket.emitWithAck('delete.category', { id });
		this.list = without(this.list, id);
	}

	destroy() {
		for (const [event, handler] of Object.entries(this.#listeners)) this.#socket.off(event, handler);
	}
}
