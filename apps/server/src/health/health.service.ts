import { Injectable, Logger } from '@nestjs/common';
import { HealthRepository } from '@noted/health/health.repository';

@Injectable()
export class HealthService {
	private readonly logger = new Logger(HealthService.name);

	constructor(private readonly healthRepository: HealthRepository) {}

	async isDatabaseReachable(): Promise<boolean> {
		try {
			await this.healthRepository.ping();
			return true;
		} catch (error) {
			this.logger.warn(
				`Database ping failed: ${error instanceof Error ? error.message : error}`,
			);

			return false;
		}
	}
}
