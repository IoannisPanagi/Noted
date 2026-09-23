import { z } from 'zod';

export const PayloadSchema = z.object({
	passphrase: z.string().min(1),
	// Fingerprint of the workspace's lock state when the token was issued, so a
	// token stops validating once that state changes. Always present.
	passwordFingerprint: z.string().min(1),
});

export type PayloadDTO = z.infer<typeof PayloadSchema>;
