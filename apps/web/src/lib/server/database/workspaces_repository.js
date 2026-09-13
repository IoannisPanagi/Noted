import db from '$lib/server/database/database.js';

const getStmt = db.prepare(`
		SELECT *
		FROM workspaces
		WHERE passphrase = ?;
	`);

const saveStmt = db.prepare(`
		INSERT INTO workspaces (passphrase,
														description,
														password)
		VALUES (?, ?, ?)
		ON CONFLICT (passphrase) DO UPDATE SET description = excluded.description,
																					 password    = excluded.password
		RETURNING
			passphrase,
			description,
			password;
	`);

const deleteStmt = db.prepare(`
		DELETE FROM workspaces
		WHERE passphrase = ?;
	`);

export function getWorkspace(workspace) {
	return getStmt.get(workspace.passphrase);
}

export function saveWorkspace(workspace) {
	return saveStmt.get(
		workspace.passphrase,
		workspace.description,
		workspace.password,
	);
}

export function deleteWorkspace(workspace) {
	return deleteStmt.run(workspace.passphrase).changes > 0;
}
