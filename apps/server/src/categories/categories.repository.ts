import { DB } from '@constants';
import { Inject, Injectable } from '@nestjs/common';
import { Category } from '@noted/types';
import { categories, type DrizzleDb, notes } from '@schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class CategoriesRepository {
	constructor(@Inject(DB) private readonly db: DrizzleDb) {}

	async findByPassphraseAndId(
		passphrase: string,
		id: string,
	): Promise<Category | undefined> {
		return this.db.query.categories.findFirst({ where: { id, passphrase } });
	}

	async findByPassphraseAndLabel(
		passphrase: string,
		label: string,
	): Promise<Category | undefined> {
		return this.db.query.categories.findFirst({
			where: { label, passphrase },
		});
	}

	async findAllByPassphrase(passphrase: string): Promise<Category[]> {
		return this.db.query.categories.findMany({ where: { passphrase } });
	}

	// An existing category is only updated when it belongs to
	// category.passphrase's workspace; otherwise nothing is written or returned
	async save(category: Category): Promise<Category[]> {
		return this.db
			.insert(categories)
			.values(category)
			.onConflictDoUpdate({
				target: [categories.id],
				set: {
					label: category.label,
					description: category.description,
				},
				setWhere: eq(categories.passphrase, category.passphrase),
			})
			.returning();
	}

	// Returns whether a category was actually deleted
	async delete(passphrase: string, id: string): Promise<boolean> {
		return this.db.transaction((tx) => {
			tx.update(notes)
				.set({ categoryId: null })
				.where(and(eq(notes.categoryId, id), eq(notes.passphrase, passphrase)))
				.run();

			return (
				tx
					.delete(categories)
					.where(
						and(eq(categories.id, id), eq(categories.passphrase, passphrase)),
					)
					.run().changes > 0
			);
		});
	}
}
