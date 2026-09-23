import { z } from 'zod';

export const UpdateNoteSchema = z.object({
	id: z.string().min(1),
	text: z.string().min(1),
	backgroundColor: z.string().min(1),
	isCompleted: z.boolean(),
	createdAt: z.string(),
	completedAt: z.string().nullable(),
	noteOrder: z.number().int(),
	categoryId: z.string().nullable(),
});

export type UpdateNoteDto = z.infer<typeof UpdateNoteSchema>;
