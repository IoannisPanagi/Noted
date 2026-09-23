import { DB, DB_CONNECTION } from '@constants';
import { Logger, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { relations } from './relations';

@Module({
	providers: [
		{
			provide: DB,
			useFactory: () => {
				const logger = new Logger('DrizzleModule');

				logger.log(`Opening database ${DB_CONNECTION}`);
				const db = drizzle(DB_CONNECTION, { relations });

				migrate(db, {
					migrationsFolder: 'drizzle',
				});
				logger.log('Database migrations are up to date');

				return db;
			},
		},
	],
	exports: [DB],
})
export class DrizzleModule {}
