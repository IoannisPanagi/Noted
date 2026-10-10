import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { relations } from './relations';

export type DrizzleDb = BetterSQLite3Database<typeof relations>;

export * from './relations';
export * from './schema';
export * as schema from './schema';
