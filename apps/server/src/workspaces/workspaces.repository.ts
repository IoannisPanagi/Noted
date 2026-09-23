import { DB } from '@constants';
import { Inject, Injectable } from '@nestjs/common';
import { Workspace } from '@noted/types';
import { categories, type DrizzleDb, notes, workspaces } from '@schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class WorkspacesRepository {
	constructor(@Inject(DB) private readonly db: DrizzleDb) {}

	async findByPassphrase(passphrase: string): Promise<Workspace | undefined> {
		return this.db.query.workspaces.findFirst({ where: { passphrase } });
	}

	async save(workspace: Workspace): Promise<Workspace[]> {
		return this.db
			.insert(workspaces)
			.values(workspace)
			.onConflictDoUpdate({
				target: [workspaces.passphrase],
				set: {
					description: workspace.description,
					password: workspace.password,
				},
			})
			.returning();
	}

	// Inserts an open workspace unless one already exists, never touching an existing one
	async ensureExists(passphrase: string): Promise<void> {
		await this.db
			.insert(workspaces)
			.values({ passphrase, description: null, password: null })
			.onConflictDoNothing({ target: [workspaces.passphrase] });
	}

	// Deletes the workspace together with everything in it, children first for the foreign keys
	async deleteWithContents(passphrase: string): Promise<void> {
		this.db.transaction((tx) => {
			tx.delete(notes).where(eq(notes.passphrase, passphrase)).run();
			tx.delete(categories).where(eq(categories.passphrase, passphrase)).run();
			tx.delete(workspaces).where(eq(workspaces.passphrase, passphrase)).run();
		});
	}

	async delete(passphrase: string): Promise<void> {
		await this.db
			.delete(workspaces)
			.where(eq(workspaces.passphrase, passphrase));
	}
}
