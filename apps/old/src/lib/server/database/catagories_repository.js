import { error } from '@sveltejs/kit';
import db from '$lib/server/database/database.js';

const getStmt = db.prepare(`
		SELECT *
		FROM categories
		WHERE passphrase = ?;
	`);

const saveTscn = db.transaction((workspace, category) => {
	db.prepare(
		`INSERT INTO workspaces(passphrase, description)
							VALUES (?, ?)
							ON CONFLICT (passphrase) DO NOTHING;`,
	).run(workspace.passphrase, workspace.description);

	return db
		.prepare(
			`
		INSERT INTO categories (id,
		                        label,
														description,
														passphrase)
		VALUES (?, ?, ?, ?)
			ON CONFLICT (passphrase, label) DO UPDATE SET
																					 description = excluded.description
																				 RETURNING *;
	`,
		)
		.get(
			category.id ?? Date.now().toString(36),
			category.label,
			category.description,
			workspace.passphrase,
		);
});
const deleteTscn = db.transaction((workspace, id) => {
	db.prepare(`UPDATE notes SET category_id = null WHERE category_id = ?`).run(
		id,
	);

	return (
		db
			.prepare(`DELETE FROM categories WHERE id = ? AND passphrase = ?`)
			.run(id, workspace.passphrase).changes > 0
	);
});

export function getCategoriesByPassphrase(passphrase) {
	return getStmt.all(passphrase);
}

export function saveCategory(workspace, category) {
	category.label = category.label.toLowerCase();
	if (category.label === 'to-dos' || category.label === 'completed') {
		throw error(409, `You cannot create a category with this name`);
	}

	return saveTscn(workspace, category);
}

export function deleteCategory(workspace, id) {
	return deleteTscn(workspace, id);
}
