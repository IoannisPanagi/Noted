import { DB, DB_CONNECTION } from '@constants';
import { Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { relations } from './relations';

@Module({
	providers: [
		{
			provide: DB,
			useFactory: () => {
				const db = drizzle(DB_CONNECTION, { relations });

				migrate(db, {
					migrationsFolder: 'drizzle',
				});

				return db;
			},
		},
	],
	exports: [DB],
})
export class DrizzleModule {}
