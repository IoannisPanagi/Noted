import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginReqSchema = z.object({
	passphrase: z.string().min(1),
	password: z.string().nullable(),
});

export class LoginReqDto extends createZodDto(LoginReqSchema) {}
