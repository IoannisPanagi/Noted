import { testNotes } from '$lib/server/data/notes_test_data.js';

const passphrase = 'test';

export function generateNotes(db) {
	const stmt = db.prepare(`
		INSERT INTO notes (id,
											 passphrase, text, backgroundColor, isCompleted,
											 createdAt, completedAt, note_order)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?);
	`);

	testNotes.forEach((note) => {
		stmt.run(
			note.id,
			passphrase,
			note.text,
			note.backgroundColor,
			note.isCompleted ? 1 : 0,
			note.createdAt,
			note.completedAt,
			note.order,
		);
	});
}
