import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Only locked workspaces need a password, so the body is optional
export const DeleteWorkspaceSchema = z
	.object({
		password: z
			.string()
			.nullish()
			.transform((password) => password || null),
	})
	.default({ password: null });

export class DeleteWorkspaceDto extends createZodDto(DeleteWorkspaceSchema) {}
