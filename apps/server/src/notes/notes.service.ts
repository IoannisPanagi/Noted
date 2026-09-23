import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CategoriesService } from '@noted/categories/categories.service';
import { CreateNoteDto } from '@noted/notes/dtos/createNote.dto';
import { UpdateNoteDto } from '@noted/notes/dtos/updateNote.dto';
import { NotesRepository } from '@noted/notes/notes.repository';
import { Note } from '@noted/types';
import { WorkspacesService } from '@noted/workspaces/workspaces.service';

@Injectable()
export class NotesService {
	private readonly logger = new Logger(NotesService.name);

	constructor(
		private readonly notesRepository: NotesRepository,
		private readonly categoriesService: CategoriesService,
		private readonly workspacesService: WorkspacesService,
	) {}

	async findByPassphraseAndId(
		passphrase: string,
		id: string,
	): Promise<Note | undefined> {
		return this.notesRepository.findByPassphraseAndId(passphrase, id);
	}

	async findAllByPassphrase(passphrase: string, isCompleted?: boolean) {
		return this.notesRepository.findAllByPassphrase(passphrase, isCompleted);
	}

	async findAllByPassphraseAndCategoryLabel(
		passphrase: string,
		label: string,
		isCompleted?: boolean,
	) {
		return this.notesRepository.findAllByPassphraseAndCategoryLabel(
			passphrase,
			label,
			isCompleted,
		);
	}

	async create(dto: CreateNoteDto, passphrase: string): Promise<Note> {
		await this.assertCategoryInWorkspace(passphrase, dto.categoryId);

		await this.workspacesService.ensureExists(passphrase);

		const [savedNote] = await this.notesRepository.save({
			id: Date.now().toString(36),
			passphrase,
			text: dto.text,
			backgroundColor: dto.backgroundColor,
			noteOrder: dto.noteOrder,
			createdAt: new Date().toISOString(),
			completedAt: null,
			isCompleted: false,
			categoryId: dto.categoryId,
		});

		this.logger.debug(
			`Created note ${savedNote.id} in workspace ${savedNote.passphrase}`,
		);

		return savedNote;
	}

	async update(dto: UpdateNoteDto, passphrase: string): Promise<Note> {
		await this.assertCategoryInWorkspace(passphrase, dto.categoryId);

		const [savedNote] = await this.notesRepository.save({
			id: dto.id,
			passphrase,
			text: dto.text,
			backgroundColor: dto.backgroundColor,
			isCompleted: dto.isCompleted,
			createdAt: dto.createdAt,
			completedAt: dto.completedAt,
			noteOrder: dto.noteOrder,
			categoryId: dto.categoryId,
		});

		this.logger.debug(
			`Updated note ${savedNote.id} in workspace ${savedNote.passphrase}`,
		);

		return savedNote;
	}

	async delete(passphrase: string, id: string): Promise<boolean> {
		const deleted = await this.notesRepository.delete(passphrase, id);

		if (deleted)
			this.logger.debug(`Deleted note ${id} from workspace ${passphrase}`);

		return deleted;
	}

	// Only the notes go; categories and the workspace row are left alone
	async deleteAllByPassphrase(passphrase: string) {
		await this.notesRepository.deleteAllByPassphrase(passphrase);
		this.logger.log(`Cleared all notes in workspace ${passphrase}`);
	}

	private async assertCategoryInWorkspace(
		passphrase: string,
		categoryId: string | null,
	) {
		if (
			categoryId !== null &&
			(await this.categoriesService.findByPassphraseAndId(
				passphrase,
				categoryId,
			)) === undefined
		)
			throw new BadRequestException('Category not found in this workspace');
	}
}
