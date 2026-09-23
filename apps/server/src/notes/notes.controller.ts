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
	ParseBoolPipe,
	Post,
	Put,
	Query,
	UsePipes,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { Passphrase } from '@noted/decorators/passphrase.decorator';
import {
	type CreateNoteDto,
	CreateNoteSchema,
} from '@noted/notes/dtos/createNote.dto';
import {
	type UpdateNoteDto,
	UpdateNoteSchema,
} from '@noted/notes/dtos/updateNote.dto';
import { NotesService } from '@noted/notes/notes.service';
import { ApiZodBody } from '@noted/openapi/zod-body.decorator';
import { ZodValidationPipe } from '@noted/pipes/zod-validation.pipe';

@ApiTags('notes')
@ApiCookieAuth()
@Controller('notes')
export class NotesController {
	constructor(private readonly notesService: NotesService) {}

	// ?complete=true|false narrows to complete/incomplete notes; omitted returns both
	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "List the workspace's notes" })
	@ApiQuery({
		name: 'complete',
		required: false,
		type: Boolean,
		description: 'Narrow to complete or incomplete notes; omitted returns both',
	})
	public async findAllByPassphrase(
		@Passphrase() passphrase: string,
		@Query('complete', new ParseBoolPipe({ optional: true }))
		complete?: boolean,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');

		return this.notesService.findAllByPassphrase(passphrase, complete);
	}

	@Get('/category/:label')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List the notes in one category' })
	@ApiQuery({
		name: 'complete',
		required: false,
		type: Boolean,
		description: 'Narrow to complete or incomplete notes; omitted returns both',
	})
	public async findAllByPassphraseAndCategoryLabel(
		@Passphrase() passphrase: string,
		@Param('label') label: string,
		@Query('complete', new ParseBoolPipe({ optional: true }))
		complete?: boolean,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');
		if (!label) throw new BadRequestException('Category label missing?');

		return this.notesService.findAllByPassphraseAndCategoryLabel(
			passphrase,
			label,
			complete,
		);
	}

	@Get('/:id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Fetch one note' })
	@ApiResponse({ status: 404, description: 'No such note in this workspace' })
	public async findById(
		@Passphrase() passphrase: string,
		@Param('id') id: string,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');
		if (!id) throw new BadRequestException('Note id missing?');

		const note = await this.notesService.findByPassphraseAndId(passphrase, id);
		if (!note) throw new NotFoundException('Note not found');

		return note;
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: 'Create a note',
		description: 'categoryId is optional; omitted or null means uncategorised.',
	})
	@ApiZodBody(CreateNoteSchema, 'note')
	@ApiResponse({
		status: 400,
		description: 'categoryId belongs to another workspace',
	})
	@UsePipes(new ZodValidationPipe(CreateNoteSchema))
	public async create(
		@Body('note') noteDto: CreateNoteDto,
		@Passphrase() passphrase: string,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');

		return await this.notesService.create(noteDto, passphrase);
	}

	@Put('/:id')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update a note' })
	@ApiZodBody(UpdateNoteSchema, 'note')
	@ApiResponse({
		status: 400,
		description:
			'Body id and route id are mismatched, or categoryId belongs to another workspace',
	})
	@ApiResponse({ status: 404, description: 'No such note in this workspace' })
	@UsePipes(new ZodValidationPipe(UpdateNoteSchema))
	public async update(
		@Body('note') note: UpdateNoteDto,
		@Passphrase() passphrase: string,
		@Param('id') id: string,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');
		if (!id) throw new BadRequestException('Note id missing?');
		if (id !== note.id)
			throw new BadRequestException('Note id and route id are mismatched');
		if (
			(await this.notesService.findByPassphraseAndId(passphrase, id)) ===
			undefined
		)
			throw new NotFoundException('Note not found, consider adding it first!');

		return await this.notesService.update(note, passphrase);
	}

	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: "Delete all of the workspace's notes",
		description: 'Categories and the workspace itself are left alone.',
	})
	public async deleteAllByPassphrase(@Passphrase() passphrase: string) {
		if (!passphrase) throw new BadRequestException('No passphrase');

		await this.notesService.deleteAllByPassphrase(passphrase);
	}

	@Delete('/:id')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete one note' })
	@ApiResponse({ status: 404, description: 'No such note in this workspace' })
	public async delete(
		@Passphrase() passphrase: string,
		@Param('id') id: string,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');
		if (!id) throw new BadRequestException('Note id missing?');

		const deleted = await this.notesService.delete(passphrase, id);
		if (!deleted) throw new NotFoundException('Note not found');
	}
}
