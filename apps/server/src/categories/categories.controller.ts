import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Param,
	Post,
	Put,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { CategoriesService } from '@noted/categories/categories.service';
import { CreateCategoryDto } from '@noted/categories/dtos/createCategory.dto';
import { UpdateCategoryDto } from '@noted/categories/dtos/updateCategory.dto';
import { Passphrase } from '@noted/decorators/passphrase.decorator';

@ApiTags('categories')
@ApiCookieAuth()
@Controller('categories')
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "List the workspace's categories" })
	public async findAllByPassphrase(@Passphrase() passphrase: string) {
		if (!passphrase) throw new BadRequestException('No passphrase');

		return this.categoriesService.findAllByPassphrase(passphrase);
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Create a category',
		description:
			"A label that already exists in the workspace updates that category's description instead.",
	})
	@ApiResponse({
		status: 409,
		description: 'Label already used by another category',
	})
	public async create(
		@Body() categoryDto: CreateCategoryDto,
		@Passphrase() passphrase: string,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');

		return await this.categoriesService.create(categoryDto, passphrase);
	}

	@Put('/:id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update a category' })
	@ApiResponse({
		status: 400,
		description: 'Body id and route id are mismatched',
	})
	@ApiResponse({
		status: 404,
		description: 'No such category in this workspace',
	})
	@ApiResponse({
		status: 409,
		description: 'Label already used by another category',
	})
	public async update(
		@Body() categoryDto: UpdateCategoryDto,
		@Passphrase() passphrase: string,
		@Param('id') id: string,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');
		if (!id) throw new BadRequestException('Category id missing?');
		if (id !== categoryDto.id)
			throw new BadRequestException('Category id and route id are mismatched');
		if (
			(await this.categoriesService.findByPassphraseAndId(passphrase, id)) ===
			undefined
		)
			throw new NotFoundException('Category not found');

		return await this.categoriesService.update(categoryDto, passphrase);
	}

	@Delete('/:id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Delete a category',
		description: 'Notes in it are kept, with their category cleared.',
	})
	@ApiResponse({
		status: 404,
		description: 'No such category in this workspace',
	})
	public async delete(
		@Passphrase() passphrase: string,
		@Param('id') id: string,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');
		if (!id) throw new BadRequestException('Category id missing?');

		const deleted = await this.categoriesService.delete(passphrase, id);
		if (!deleted) throw new NotFoundException('Category not found');
	}
}
