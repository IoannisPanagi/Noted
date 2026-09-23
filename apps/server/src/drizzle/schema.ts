import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	sqliteTable,
	text,
	unique,
} from 'drizzle-orm/sqlite-core';

export const workspaces = sqliteTable('workspaces', {
	passphrase: text().primaryKey(),
	description: text(),
	password: text(),
});

export const categories = sqliteTable(
	'categories',
	{
		id: text().primaryKey(),
		label: text().notNull(),
		description: text(),
		passphrase: text()
			.notNull()
			.references(() => workspaces.passphrase),
	},
	(t) => [
		unique('categories_unique_per_workspace').on(t.label, t.passphrase),
		index('idx_categories').on(t.passphrase),
	],
);

export const notes = sqliteTable(
	'notes',
	{
		id: text().primaryKey(),
		passphrase: text()
			.notNull()
			.references(() => workspaces.passphrase),
		text: text().notNull(),
		backgroundColor: text().notNull(),
		isCompleted: integer().notNull().default(0),
		createdAt: text().notNull(),
		completedAt: text(),
		noteOrder: integer('note_order').notNull(),
		categoryId: text('category_id')
			.default(sql`NULL`)
			.references(() => categories.id),
	},
	(t) => [
		unique('notes_unique_per_workspace').on(t.passphrase, t.id),
		index('idx_passphrase').on(t.passphrase),
	],
);
