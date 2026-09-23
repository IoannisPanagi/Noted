import { z } from 'zod';

// Only a locked workspace needs its password to confirm deletion, so the
// body may be omitted entirely
export const DeleteWorkspaceSchema = z
	.object({
		password: z
			.string()
			.nullish()
			.transform((password) => password || null),
	})
	.default({ password: null });

export type DeleteWorkspaceDto = z.infer<typeof DeleteWorkspaceSchema>;
