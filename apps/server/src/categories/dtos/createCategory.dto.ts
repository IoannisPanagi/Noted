import { z } from 'zod';

export const CreateCategorySchema = z.object({
	label: z.string().trim().toLowerCase().min(1),
	description: z
		.string()
		.nullish()
		.transform((description) => description || null),
});

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;
