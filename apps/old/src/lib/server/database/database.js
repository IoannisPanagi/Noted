import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { dev } from '$app/environment';
import migrate from '$lib/server/database/database_migration.js';
import { logger } from '$lib/server/logger.js';

const dbPath = dev
	? 'notes-dev.db'
	: (process.env.DATABASE_PATH ?? './data/notes.db');

const dbVersion = 4;

// Create directory if needed
const dir = dirname(dbPath);
if (dir !== '.') {
	mkdirSync(dir, { recursive: true });
}

logger.info('Initializing database...');

const db = new Database(dbPath, {
	verbose: dev
		? (message) => {
				const cleanedSql = message
					.replace(/\n\t/g, ' ')
					.replace(/\s+/g, ' ')
					.trim();
				logger.debug(cleanedSql);
			}
		: undefined,
});

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

if (db.pragma('user_version', { simple: true }) === 0) {
	db.pragma(`user_version = ${dbVersion}`);
}

db.exec(`
	CREATE TABLE IF NOT EXISTS workspaces
	(
		passphrase  TEXT PRIMARY KEY,
		description TEXT,
		password    TEXT
	);

	CREATE TABLE IF NOT EXISTS categories
	(
		id          TEXT PRIMARY KEY,
		label       TEXT NOT NULL,
		description TEXT,
		passphrase  TEXT NOT NULL REFERENCES workspaces (passphrase),
		CONSTRAINT categories_unique_per_workspace UNIQUE (label, passphrase)
	);

	CREATE TABLE IF NOT EXISTS notes
	(
		id              TEXT PRIMARY KEY,
		passphrase      TEXT    NOT NULL REFERENCES workspaces (passphrase),
		text            TEXT    NOT NULL,
		backgroundColor TEXT    NOT NULL,
		isCompleted     INTEGER NOT NULL DEFAULT 0,
		createdAt       TEXT    NOT NULL,
		completedAt     TEXT,
		note_order      INTEGER NOT NULL,
		category_id     TEXT             DEFAULT null REFERENCES categories (id),
		CONSTRAINT notes_unique_per_workspace UNIQUE (passphrase, id)
	);

	CREATE TABLE IF NOT EXISTS migrations
	(
		label  TEXT PRIMARY KEY,
		run_at TEXT DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_passphrase ON notes (passphrase);
	CREATE INDEX IF NOT EXISTS idx_categories ON categories (passphrase);
`);

// Don't do the migration sequence if the database user_version is the same as a fresh one
if (db.pragma('user_version', { simple: true }) < dbVersion) {
	migrate(db);
}

logger.info('Completed database initialization...');

export default db;
