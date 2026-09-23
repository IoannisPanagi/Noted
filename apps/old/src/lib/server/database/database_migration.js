import { logger } from '$lib/server/logger.js';

export default function migrate(db) {
	logger.info(`Starting version migration`);

	backgroundColorMigration(db);
	backgroundColorMigrationTwo(db);

	addWorkspaceReferences(db, 'addWorkspaceReferences_migration_26-12-2025');

	logger.info('Migration completed');
}

// Data migration methods
function backgroundColorMigration(db) {
	const migrationLabel = 'backgroundColor_migration_8-12-2025';

	const CONVERSION_DATA = {
		'bg-red-100': 'bg-red-200 dark:bg-red-600',
		'bg-amber-100': 'bg-amber-200 dark:bg-amber-600',
		'bg-orange-200': 'bg-orange-200 dark:bg-orange-700',
		'bg-orange-200 dark:bg-orange-600': 'bg-orange-200 dark:bg-orange-700',
		'bg-yellow-100': 'bg-yellow-200 dark:bg-yellow-600',
		'bg-lime-200': 'bg-lime-200 dark:bg-lime-600',
		'bg-green-200': 'bg-green-200 dark:bg-green-600',
		'bg-emerald-200': 'bg-emerald-200 dark:bg-emerald-600',
		'bg-teal-100': 'bg-teal-200 dark:bg-teal-600',
		'bg-cyan-100': 'bg-cyan-200 dark:bg-cyan-600',
		'bg-sky-100': 'bg-sky-200 dark:bg-sky-600',
		'bg-blue-100': 'bg-blue-200 dark:bg-blue-600',
		'bg-indigo-100': 'bg-indigo-200 dark:bg-indigo-600',
		'bg-violet-100': 'bg-violet-200 dark:bg-violet-600',
		'bg-purple-100': 'bg-purple-200 dark:bg-purple-700',
		'bg-purple-200 dark:bg-purple-600': 'bg-purple-200 dark:bg-purple-700',
		'bg-fuchsia-100': 'bg-fuchsia-200 dark:bg-fuchsia-700',
		'bg-fuchsia-200 dark:bg-fuchsia-600': 'bg-fuchsia-200 dark:bg-fuchsia-700',
		'bg-pink-100': 'bg-pink-200 dark:bg-pink-600',
	};

	convertBackgroundColors(db, migrationLabel, CONVERSION_DATA);
}

// Data migration methods
function backgroundColorMigrationTwo(db) {
	const migrationLabel = 'backgroundColor_migration_9-12-2025';

	const CONVERSION_DATA = {
		'bg-red-200 dark:bg-red-600': 'bg-powder-blush',
		'bg-amber-200 dark:bg-amber-600': 'bg-apricot-cream',
		'bg-orange-200 dark:bg-orange-700': 'bg-apricot-cream',
		'bg-yellow-200 dark:bg-yellow-600': 'bg-cream',
		'bg-lime-200 dark:bg-lime-600': 'bg-tea-green',
		'bg-green-200 dark:bg-green-600': 'bg-tea-green',
		'bg-emerald-200 dark:bg-emerald-600': 'bg-tea-green',
		'bg-teal-200 dark:bg-teal-600': 'bg-electric-aqua',
		'bg-cyan-200 dark:bg-cyan-600': 'bg-electric-aqua',
		'bg-sky-200 dark:bg-sky-600': 'bg-electric-aqua',
		'bg-blue-200 dark:bg-blue-600': 'bg-baby-blue-ice',
		'bg-indigo-200 dark:bg-indigo-600': 'bg-baby-blue-ice',
		'bg-violet-200 dark:bg-violet-600': 'bg-periwinkle',
		'bg-purple-200 dark:bg-purple-700': 'bg-periwinkle',
		'bg-fuchsia-200 dark:bg-fuchsia-700': 'bg-mauve',
		'bg-pink-200 dark:bg-pink-600': 'bg-mauve',
	};

	convertBackgroundColors(db, migrationLabel, CONVERSION_DATA);
}

function convertBackgroundColors(db, migrationLabel, conversionData) {
	if (
		db.prepare(`SELECT * FROM migrations WHERE label = ?`).get(migrationLabel)
	)
		return;

	logger.info(`Attempting to conduct ${migrationLabel} migration`);

	const stmt = db.prepare(
		'UPDATE notes SET backgroundColor = ? WHERE backgroundColor = ?',
	);

	let updateCount = 0;
	for (const [oldBackgroundColor, backgroundColor] of Object.entries(
		conversionData,
	)) {
		logger.trace(
			`Changing notes of bg-color ${oldBackgroundColor} to ${backgroundColor}`,
		);
		const response = stmt.run(backgroundColor, oldBackgroundColor);
		logger.trace(`Found and updated ${response.changes} notes`);
		updateCount += response.changes;
	}

	if (updateCount > 0) {
		db.exec(`INSERT INTO migrations(label) VALUES (${migrationLabel})`);

		logger.debug(`Updated ${updateCount} note(s) with new color format`);
		logger.info(`Completed ${migrationLabel}`);
	} else {
		logger.info('No notes found to be migrated');
	}
}

function addWorkspaceReferences(db, migrationLabel) {
	if (
		db.prepare(`SELECT * FROM migrations WHERE label = ?`).get(migrationLabel)
	)
		return;

	logger.debug('Beginning the addition of the workspace references');

	if (db.pragma('user_version', { simple: true }) > 3) return;

	const migrate = db.transaction(() => {
		db.exec(`
      INSERT OR IGNORE INTO workspaces(passphrase)
      SELECT DISTINCT passphrase FROM notes;
    `);

		logger.trace('Created the workspaces from the existing note passphrases');

		db.exec(`
			CREATE TABLE notes_new
			(
				id              TEXT PRIMARY KEY,
				passphrase      TEXT    NOT NULL REFERENCES workspaces (passphrase),
				text            TEXT    NOT NULL,
				backgroundColor TEXT    NOT NULL,
				isCompleted     INTEGER NOT NULL DEFAULT 0,
				createdAt       TEXT    NOT NULL,
				completedAt     TEXT,
				note_order      INTEGER NOT NULL,
				category_id     TEXT             DEFAULT NULL REFERENCES categories (id),
				CONSTRAINT notes_unique_per_workspace UNIQUE (passphrase, id)
			);

			INSERT INTO notes_new (id, passphrase, text, backgroundColor, isCompleted, createdAt, completedAt, note_order)
			SELECT id,
						 passphrase,
						 text,
						 backgroundColor,
						 isCompleted,
						 createdAt,
						 completedAt,
						 note_order
			FROM notes;

			DROP TABLE notes;

			ALTER TABLE notes_new
				RENAME TO notes;

			CREATE INDEX IF NOT EXISTS idx_passphrase ON notes (passphrase);
		`);

		logger.trace('Added the category_id column to the notes table');

		db.pragma('user_version = 4');
		logger.trace(`Bumped database version to 4`);
		db.prepare('INSERT INTO migrations(label) VALUES (?)').run(migrationLabel);
	});

	migrate();

	logger.info(`Completed ${migrationLabel}`);
}
