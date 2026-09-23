import {
	ArgumentMetadata,
	BadRequestException,
	Injectable,
	PipeTransform,
} from '@nestjs/common';
import { ZodError, ZodType, z } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
	constructor(private readonly schema: ZodType) {}

	transform(value: unknown, metadata: ArgumentMetadata) {
		// Custom param decorators (metadata.type === 'custom') and route
		// params/queries are left untouched - this pipe only guards bodies.
		if (metadata.type !== 'body') return value;

		const result = this.schema.safeParse(value);

		if (!result.success) {
			throw new BadRequestException({
				message: 'Validation failed',
				errors: this.formatErrors(result.error),
			});
		}

		return result.data;
	}

	private formatErrors(error: ZodError) {
		return z.flattenError(error).fieldErrors;
	}
}
