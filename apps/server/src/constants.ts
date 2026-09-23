import { createHmac } from 'node:crypto';
import { existsSync } from 'node:fs';
import { CookieOptions } from 'express';

// Single entry point for configuration: load .env (without overriding
// variables already set in the environment) before anything reads process.env
if (existsSync('.env')) process.loadEnvFile('.env');

if (!process.env.DB_FILE_NAME)
	throw new Error('DB_FILE_NAME environment variable required');
export const DB = 'SQLITE_DATABASE';
export const DB_CONNECTION = process.env.DB_FILE_NAME;
export const APP_NAME = 'Noted';
export const APP_VERSION = '1.0 (Solaris)';
export const APP_AUTH_COOKIE_NAME = `${APP_NAME}-authentication`;
export const IS_PUBLIC_KEY = 'isPublic';

export const APP_WORKSPACE_LOCAL_NAME = 'NOTED_WORKSPACE';

if (!process.env.JWT_SECRET)
	throw new Error('JWT_SECRET environment variable required');
if (!process.env.JWT_EXPIRY)
	throw new Error('JWT_EXPIRY environment variable required');
export const JWT_CONSTANTS = {
	SECRET: process.env.JWT_SECRET,
	// Milliseconds, as JWT_EXPIRY is documented and as the cookie's maxAge expects
	EXPIRY: +process.env.JWT_EXPIRY,
	// jsonwebtoken reads a numeric expiresIn as seconds
	EXPIRY_SECONDS: Math.floor(+process.env.JWT_EXPIRY / 1000),
};

// Optional: the port to listen on, and the browser origins allowed to call the
// API with credentials (comma separated). CORS stays off when none are given,
// which is what a same-origin or reverse-proxied deployment wants.
export const APP_PORT = Number(process.env.PORT ?? 3000);
export const CORS_ORIGINS =
	process.env.CORS_ORIGINS?.split(',')
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0) ?? [];

// Optional: pino's level (silent, fatal, error, warn, info, debug, trace);
// pino itself rejects anything else at startup
export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

if (!process.env.PWF_SECRET)
	throw new Error('PWF_SECRET environment variable required');
// Key for the password fingerprint carried by every token: HMAC(key, workspace
// lock state). It gets its own secret, kept apart from the JWT signing key, and
// the version label allows invalidating every fingerprint without rotating it.
export const PASSWORD_FINGERPRINT_KEY = createHmac(
	'sha256',
	process.env.PWF_SECRET,
)
	.update('noted:password-fingerprint:v1')
	.digest();

// Best & most secure options for the cookie by default
export const DEFAULT_COOKIE_SETTINGS: CookieOptions = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	path: '/',
	sameSite: 'strict',
	maxAge: JWT_CONSTANTS.EXPIRY,
};
