import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TokenResSchema = z.object({
	token: z.string(),
});

export class TokenResDto extends createZodDto(TokenResSchema) {}
