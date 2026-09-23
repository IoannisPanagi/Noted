// constants.ts validates its environment at import time, so tests need one
process.env.DB_FILE_NAME ??= ':memory:';
process.env.JWT_SECRET ??= 'test-jwt-secret';
process.env.JWT_EXPIRY ??= '43200000';
process.env.PWF_SECRET ??= 'test-password-fingerprint-secret';
// Keeps request logs out of the test output
process.env.LOG_LEVEL ??= 'silent';
