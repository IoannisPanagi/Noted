import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// TODO Normalise the passphrase once here (trim? case-fold?) while keeping existing workspaces reachable
export const LoginReqSchema = z.object({
	passphrase: z.string().min(1),
	password: z.string().nullable(),
});

export class LoginReqDto extends createZodDto(LoginReqSchema) {}
