import { z } from 'zod';

export const PayloadSchema = z.object({
	passphrase: z.string().min(1),
	// The workspace's lock state at issue, so the token dies when it changes
	passwordFingerprint: z.string().min(1),
});

export type PayloadDTO = z.infer<typeof PayloadSchema>;
