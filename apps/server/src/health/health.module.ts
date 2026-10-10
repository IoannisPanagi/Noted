import { DrizzleModule } from '@drizzle/drizzle.module';
import { Module } from '@nestjs/common';
import { HealthController } from '@noted/health/health.controller';
import { HealthRepository } from '@noted/health/health.repository';
import { HealthService } from '@noted/health/health.service';

@Module({
	imports: [DrizzleModule],
	providers: [HealthService, HealthRepository],
	controllers: [HealthController],
})
export class HealthModule {}
