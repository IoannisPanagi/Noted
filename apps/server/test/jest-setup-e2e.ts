import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

// Runs before any import, as constants.ts validates the environment on load
process.env.DB_FILE_NAME = join(
	process.env.NOTED_E2E_DIRECTORY ?? '',
	`${randomUUID()}.db`,
);
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.PWF_SECRET = 'test-password-fingerprint-secret';
process.env.JWT_EXPIRY = '43200000';
// Keeps request logs out of the test output
process.env.LOG_LEVEL ??= 'silent';
