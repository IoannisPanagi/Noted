import { createHmac } from 'node:crypto';
import { config } from 'dotenv';
import { CookieOptions } from 'express';

// Loads .env without overriding variables already set, before anything reads process.env
config({ quiet: true });

export const DB = 'SQLITE_DATABASE';
export const DB_CONNECTION = process.env.DB_FILE_NAME ?? 'noted.db';
export const APP_NAME = 'Noted';
export const APP_VERSION = '1.0.1 (Solaris)';
export const APP_AUTH_COOKIE_NAME = `${APP_NAME}-authentication`;
export const IS_PUBLIC_KEY = 'isPublic';

export const APP_WORKSPACE_LOCAL_NAME = 'NOTED_WORKSPACE';

if (!process.env.JWT_SECRET)
	throw new Error('JWT_SECRET environment variable required');
// 12 hours in milliseconds
const JWT_EXPIRY = Number(process.env.JWT_EXPIRY ?? 43_200_000);
export const JWT_CONSTANTS = {
	SECRET: process.env.JWT_SECRET,
	// Milliseconds, as JWT_EXPIRY is documented and as the cookie's maxAge expects
	EXPIRY: JWT_EXPIRY,
	// jsonwebtoken reads a numeric expiresIn as seconds
	EXPIRY_SECONDS: Math.floor(JWT_EXPIRY / 1000),
};

// CORS stays off without origins, which suits same-origin or proxied deployments
export const APP_PORT = Number(process.env.PORT ?? 3000);
export const CORS_ORIGINS =
	process.env.CORS_ORIGINS?.split(',')
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0) ?? [];

export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';

if (!process.env.PWF_SECRET)
	throw new Error('PWF_SECRET environment variable required');
// Kept apart from the JWT key; bumping the version invalidates every fingerprint
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
