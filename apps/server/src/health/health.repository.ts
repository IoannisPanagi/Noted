import { DB } from '@constants';
import { Inject, Injectable } from '@nestjs/common';
import type { DrizzleDb } from '@schema';
import { sql } from 'drizzle-orm';

@Injectable()
export class HealthRepository {
	constructor(@Inject(DB) private readonly db: DrizzleDb) {}

	// Throws if the database can't be reached
	async ping(): Promise<void> {
		await this.db.run(sql`SELECT 1`);
	}
}
