import { upsert, without } from '$lib/utils/collection.js';
import { readActiveCategory, setActiveCategory } from '$lib/utils/localStorage.js';

// The workspace's categories, over the socket. It lives as long as the
// CategoriesProvider that made it, which takes its listeners off the socket
export class Categories {
	// Raw: every change replaces the list
	list = $state.raw([]);
	// Until the first load answers
	loading = $state(true);
	error = $state.raw(null);

	// The folder picked (remembered between visits), and the one actually open: a
	// pick that no longer exists (deleted, or from another workspace) is "All",
	// null, without anything resetting the pick
	selectedId = $state(readActiveCategory() ?? null);
	activeId = $derived(this.list.some((category) => category.id === this.selectedId) ? this.selectedId : null);

	#socket;
	#listeners = {
		// Every (re)connect loads again, so whatever was missed while away comes in
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
			const res = await this.#socket.emitWithAck('list.categories');
			if (!res.ok) throw new Error('Could not load the categories');
			this.list = res.data;
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

	// Awaiting the acknowledgement means a refusal reaches the caller's catch
	async add(category) {
		const res = await this.#socket.emitWithAck('add.category', { category });
		if (!res.ok) throw new Error('Failed to add new category');
		this.list = upsert(this.list, res.data);
	}

	async update(category) {
		const res = await this.#socket.emitWithAck('update.category', { category });
		if (!res.ok) throw new Error('Failed to update category');
		this.list = upsert(this.list, res.data);
	}

	async remove(id) {
		const res = await this.#socket.emitWithAck('delete.category', { id });
		if (!res.ok) throw new Error('Failed to delete category');
		this.list = without(this.list, id);
	}

	destroy() {
		for (const [event, handler] of Object.entries(this.#listeners)) this.#socket.off(event, handler);
	}
}
