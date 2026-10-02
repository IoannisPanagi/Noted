import { upsert, without } from '$lib/utils/collection.js';

// Exported so notes can offer the palette when changing colour
export const COLORS = [
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
	return COLORS[Math.floor(((Math.random() + Math.random() + Math.random()) % 1) * COLORS.length)];
}

// Every note in the workspace, over the socket; folders and "Show completed"
// only filter them. It lives as long as the NotesProvider that made it, which
// takes its listeners off the socket
export class Notes {
	// Raw: every change replaces the list
	list = $state.raw([]);
	// Until the first load answers
	loading = $state(true);
	error = $state.raw(null);

	#socket;
	#listeners = {
		// Every (re)connect loads again, so whatever was missed while away comes in
		connect: () => this.load(),
		'note.created': (note) => (this.list = upsert(this.list, note)),
		'note.updated': (note) => (this.list = upsert(this.list, note)),
		'note.deleted': (id) => (this.list = without(this.list, id)),
		'notes.cleared': () => (this.list = []),
		// The server un-assigns a deleted category's notes without sending them
		// again, so they fall back to "All" here
		'category.deleted': (categoryId) =>
			(this.list = this.list.map((note) =>
				note.categoryId === categoryId ? { ...note, categoryId: null } : note,
			)),
	};

	constructor(socket) {
		this.#socket = socket;
		for (const [event, handler] of Object.entries(this.#listeners)) socket.on(event, handler);
	}

	// No filters: done and not done, every category
	async load() {
		try {
			const res = await this.#socket.emitWithAck('list.notes', {});
			if (!res.ok) throw new Error('Could not load the notes');
			this.list = res.data;
			this.error = null;
		} catch (err) {
			this.error = err;
		} finally {
			this.loading = false;
		}
	}

	// Awaiting the acknowledgement means a refusal reaches the caller's catch
	async add(text, categoryId) {
		const res = await this.#socket.emitWithAck('add.note', {
			note: {
				text,
				backgroundColor: randomBackgroundColor(),
				noteOrder: this.list.length,
				categoryId: categoryId ?? null,
			},
		});
		if (!res.ok) throw new Error('Failed to add note');
		this.list = upsert(this.list, res.data);
	}

	async update(note) {
		const res = await this.#socket.emitWithAck('update.note', { note });
		if (!res.ok) throw new Error('Failed to update note');
		this.list = upsert(this.list, res.data);
	}

	async toggleComplete(note) {
		await this.update({
			...note,
			isCompleted: !note.isCompleted,
			completedAt: note.isCompleted ? null : new Date().toISOString(),
		});
	}

	async remove(id) {
		const res = await this.#socket.emitWithAck('delete.note', { id });
		if (!res.ok) throw new Error('Failed to delete note');
		this.list = without(this.list, id);
	}

	async clear() {
		const res = await this.#socket.emitWithAck('clear.notes');
		if (!res.ok) throw new Error('Failed to clear notes');
		this.list = [];
	}

	destroy() {
		for (const [event, handler] of Object.entries(this.#listeners)) this.#socket.off(event, handler);
	}
}
