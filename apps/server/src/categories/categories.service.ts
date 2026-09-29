import { ConflictException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CategoriesRepository } from '@noted/categories/categories.repository';
import { CreateCategoryDto } from '@noted/categories/dtos/createCategory.dto';
import { UpdateCategoryDto } from '@noted/categories/dtos/updateCategory.dto';
import { Category } from '@noted/types';
import { WorkspacesService } from '@noted/workspaces/workspaces.service';

@Injectable()
export class CategoriesService {
	constructor(
		private readonly categoriesRepository: CategoriesRepository,
		private readonly workspacesService: WorkspacesService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async findByPassphraseAndId(passphrase: string, id: string) {
		return this.categoriesRepository.findByPassphraseAndId(passphrase, id);
	}

	async findByPassphraseAndLabel(passphrase: string, label: string) {
		return this.categoriesRepository.findByPassphraseAndLabel(
			passphrase,
			label,
		);
	}

	async findAllByPassphrase(passphrase: string) {
		return this.categoriesRepository.findAllByPassphrase(passphrase);
	}

	// Creating a label that already exists in the workspace updates its description instead
	async create(dto: CreateCategoryDto, passphrase: string): Promise<Category> {
		const existingCategory =
			await this.categoriesRepository.findByPassphraseAndLabel(
				passphrase,
				dto.label,
			);

		await this.workspacesService.ensureExists(passphrase);

		const [savedCategory] = await this.categoriesRepository.save({
			id: existingCategory?.id ?? Date.now().toString(36),
			label: dto.label,
			description: dto.description,
			passphrase,
		});

		await this.eventEmitter.emitAsync('category.created', {
			category: savedCategory,
			passphrase,
		});

		return savedCategory;
	}

	async update(dto: UpdateCategoryDto, passphrase: string): Promise<Category> {
		const categoryWithLabel =
			await this.categoriesRepository.findByPassphraseAndLabel(
				passphrase,
				dto.label,
			);
		if (categoryWithLabel && categoryWithLabel.id !== dto.id)
			throw new ConflictException('A category with this label already exists');

		const [savedCategory] = await this.categoriesRepository.save({
			id: dto.id,
			label: dto.label,
			description: dto.description,
			passphrase,
		});

		await this.eventEmitter.emitAsync('category.updated', {
			category: savedCategory,
			passphrase,
		});

		return savedCategory;
	}

	async delete(passphrase: string, id: string): Promise<boolean> {
		const deleted = await this.categoriesRepository.delete(passphrase, id);

		if (deleted)
			await this.eventEmitter.emitAsync('category.deleted', { id, passphrase });

		return deleted;
	}
}
