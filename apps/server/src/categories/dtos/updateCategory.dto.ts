import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateCategorySchema = z.object({
	id: z.string().min(1),
	label: z.string().trim().toLowerCase().min(1),
	description: z
		.string()
		.nullish()
		.transform((description) => description || null),
});

export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
