import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

// constants.ts validates its environment at import time, so this has to run
// before any module is loaded. Each spec file gets its own database file inside
// the run's temporary directory (created in jest-global-setup).
process.env.DB_FILE_NAME = join(
	process.env.NOTED_E2E_DIRECTORY ?? '',
	`${randomUUID()}.db`,
);
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.PWF_SECRET = 'test-password-fingerprint-secret';
process.env.JWT_EXPIRY = '43200000';
