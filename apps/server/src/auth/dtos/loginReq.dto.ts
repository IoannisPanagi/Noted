import { z } from 'zod';

export const LoginReqSchema = z.object({
	passphrase: z.string().min(1),
	password: z.string().nullable(),
});

export type LoginReqDto = z.infer<typeof LoginReqSchema>;
