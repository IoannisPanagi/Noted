import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateWorkspaceSchema = z
	.object({
		description: z
			.string()
			.nullish()
			.transform((description) => description || null),
		password: z
			.string()
			.nullish()
			.transform((password) => password || null),
	})
	.default({
		description: null,
		password: null,
	});

export class UpdateWorkspaceDto extends createZodDto(UpdateWorkspaceSchema) {}
