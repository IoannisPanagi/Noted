import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateNoteSchema = z.object({
	text: z.string().min(1),
	backgroundColor: z.string().min(1),
	noteOrder: z.number().int(),
	categoryId: z
		.string()
		.min(1)
		.nullish()
		.transform((categoryId) => categoryId ?? null),
});

export class CreateNoteDto extends createZodDto(CreateNoteSchema) {}

// The API takes the note wrapped as { note }
export const CreateNoteReqSchema = z.object({ note: CreateNoteSchema });

export class CreateNoteReqDto extends createZodDto(CreateNoteReqSchema) {}
