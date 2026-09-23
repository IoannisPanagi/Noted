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

export type CreateNoteDto = z.infer<typeof CreateNoteSchema>;
