import { z } from 'zod';

export const TokenResSchema = z.object({
	token: z.string(),
});

export type TokenResDto = z.infer<typeof TokenResSchema>;
