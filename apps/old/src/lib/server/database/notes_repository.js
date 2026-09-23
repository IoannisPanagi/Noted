import db from '$lib/server/database/database.js';

const getByPassphraseStmt = db.prepare(`
		SELECT
			id,
			text,
			backgroundColor,
			isCompleted,
			createdAt,
			completedAt,
			category_id as "category",
			note_order as "order"
		FROM notes
		WHERE passphrase = ?
		ORDER BY note_order DESC;
	`);

const getByPassphraseAndCategoryStmt = db.prepare(`
	SELECT n.id,
				 n.text,
				 n.backgroundColor,
				 n.isCompleted,
				 n.createdAt,
				 n.completedAt,
				 n.category_id as "category",
				 n.note_order as "order"
	FROM notes as n
	INNER JOIN categories as c ON n.category_id = c.id
	WHERE n.passphrase = ?
		AND c.label = ?
	ORDER BY note_order DESC;
`);

const saveTscn = db.transaction((passphrase, note) => {
	db.prepare(
		`INSERT INTO workspaces (passphrase)
									VALUES (?) ON CONFLICT (passphrase) DO NOTHING;`,
	).run(passphrase);

	return db
		.prepare(
			`
				INSERT INTO notes (id,
													 passphrase, text, backgroundColor, isCompleted,
													 createdAt, completedAt, category_id, note_order)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
				ON CONFLICT (passphrase, id) DO UPDATE SET text            = excluded.text,
																									 backgroundColor = excluded.backgroundColor,
																									 isCompleted     = excluded.isCompleted,
																									 completedAt     = excluded.completedAt,
																									 category_id     = excluded.category_id,
																									 note_order      = excluded.note_order
				RETURNING
					id,
					text,
					backgroundColor,
					isCompleted,
					createdAt,
					completedAt,
					category_id as "category",
					note_order as "order";
			`,
		)
		.get(
			note.id ?? Date.now().toString(36),
			passphrase,
			note.text,
			note.backgroundColor,
			note.isCompleted ? 1 : 0,
			note.createdAt,
			note.completedAt,
			note.category,
			note.order,
		);
});

const deleteStmt = db.prepare(`
		DELETE
		FROM notes
		WHERE passphrase = ?
			AND id = ?
	`);

const deleteAllStmt = db.prepare(`
	DELETE FROM notes
	WHERE passphrase = ?
	`);

export function getNotesByPassphrase(passphrase) {
	const rows = getByPassphraseStmt.all(passphrase);

	return rows.map((row) => ({
		...row,
		isCompleted: Boolean(row.isCompleted),
	}));
}

export function getNotesByPassphraseAndCategory(passphrase, category) {
	const rows = getByPassphraseAndCategoryStmt.all(passphrase, category);

	return rows.map((row) => ({
		...row,
		isCompleted: Boolean(row.isCompleted),
	}));
}

export function saveNote(passphrase, note) {
	note.category = note.category?.id ?? note.category;

	if (note.category === 1 || note.category === 2) {
		note.category = null;
	}

	const dbNote = saveTscn(passphrase, note);

	return {
		...dbNote,
		isCompleted: Boolean(dbNote.isCompleted),
	};
}

export function deleteNote(passphrase, noteId) {
	return deleteStmt.run(passphrase, noteId).changes > 0;
}

export function deleteNotes(passphrase) {
	return deleteAllStmt.run(passphrase).changes > 0;
}
