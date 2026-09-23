import { ApiBody } from '@nestjs/swagger';
import { ZodType, z } from 'zod';

// The Zod schema stays the single source of truth (see ERRORS-CORRECTION-API
// §1): the documented body is derived from it rather than a parallel class.
// 'input' describes what a client sends, before any transform runs.
export function zodJsonSchema(schema: ZodType): Record<string, unknown> {
	const { $schema, ...jsonSchema } = z.toJSONSchema(schema, {
		io: 'input',
		unrepresentable: 'any',
	});

	return jsonSchema;
}

// `property` documents the handlers that read a wrapped body, e.g. @Body('note')
export const ApiZodBody = (schema: ZodType, property?: string) =>
	ApiBody({
		schema: property
			? {
					type: 'object',
					required: [property],
					properties: { [property]: zodJsonSchema(schema) },
				}
			: zodJsonSchema(schema),
	});
