import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
	workspaces: {
		categories: r.many.categories(),
		notes: r.many.notes(),
	},

	categories: {
		workspace: r.one.workspaces({
			from: r.categories.passphrase,
			to: r.workspaces.passphrase,
		}),
		notes: r.many.notes(),
	},

	notes: {
		category: r.one.categories({
			from: r.notes.categoryId,
			to: r.categories.id,
		}),
		workspace: r.one.workspaces({
			from: r.notes.passphrase,
			to: r.workspaces.passphrase,
		}),
	},
}));
