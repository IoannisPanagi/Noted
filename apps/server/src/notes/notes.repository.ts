import { DB } from '@constants';
import { Inject, Injectable } from '@nestjs/common';
import { Note } from '@noted/types';
import { type DrizzleDb, notes } from '@schema';
import { and, eq, sql } from 'drizzle-orm';

type NoteRow = typeof notes.$inferSelect;

function toDomain(row: NoteRow): Note {
	return { ...row, isCompleted: Boolean(row.isCompleted) };
}

function toRow(note: Note) {
	return { ...note, isCompleted: note.isCompleted ? 1 : 0 };
}

// createdAt settles notes that share an order, left over from when the client picked it
const NEWEST_FIRST = { noteOrder: 'desc', createdAt: 'desc' } as const;

// No filter when isCompleted is undefined, so both complete and incomplete notes match
function completionFilter(isCompleted?: boolean) {
	return isCompleted === undefined ? {} : { isCompleted: isCompleted ? 1 : 0 };
}

@Injectable()
export class NotesRepository {
	constructor(@Inject(DB) private readonly db: DrizzleDb) {}

	async findByPassphraseAndId(
		passphrase: string,
		id: string,
	): Promise<Note | undefined> {
		const row = await this.db.query.notes.findFirst({
			where: { id, passphrase },
		});
		return row ? toDomain(row) : undefined;
	}

	async findAllByPassphrase(
		passphrase: string,
		isCompleted?: boolean,
	): Promise<Note[]> {
		const rows = await this.db.query.notes.findMany({
			where: { passphrase, ...completionFilter(isCompleted) },
			orderBy: NEWEST_FIRST,
		});
		return rows.map(toDomain);
	}

	async findAllByPassphraseAndCategoryLabel(
		passphrase: string,
		label: string,
		isCompleted?: boolean,
	): Promise<Note[]> {
		const rows = await this.db.query.notes.findMany({
			where: {
				category: { label },
				passphrase,
				...completionFilter(isCompleted),
			},
			orderBy: NEWEST_FIRST,
		});
		return rows.map(toDomain);
	}

	// The order is picked inside the insert, so two notes added at once can't share one
	async create(note: Omit<Note, 'noteOrder'>): Promise<Note> {
		const [row] = await this.db
			.insert(notes)
			.values({
				...note,
				isCompleted: note.isCompleted ? 1 : 0,
				noteOrder: sql`(select coalesce(max(note_order), -1) + 1 from notes where passphrase = ${note.passphrase})`,
			})
			.returning();

		return toDomain(row);
	}

	// Only updates a note in note.passphrase's workspace
	async save(note: Note): Promise<Note[]> {
		const rows = await this.db
			.insert(notes)
			.values(toRow(note))
			.onConflictDoUpdate({
				target: [notes.id],
				set: {
					text: note.text,
					backgroundColor: note.backgroundColor,
					isCompleted: note.isCompleted ? 1 : 0,
					completedAt: note.completedAt,
					categoryId: note.categoryId,
					noteOrder: note.noteOrder,
				},
				setWhere: eq(notes.passphrase, note.passphrase),
			})
			.returning();

		return rows.map(toDomain);
	}

	async delete(passphrase: string, id: string): Promise<boolean> {
		const result = await this.db
			.delete(notes)
			.where(and(eq(notes.id, id), eq(notes.passphrase, passphrase)));
		return result.changes > 0;
	}

	async deleteAllByPassphrase(passphrase: string) {
		await this.db.delete(notes).where(eq(notes.passphrase, passphrase));
	}
}
