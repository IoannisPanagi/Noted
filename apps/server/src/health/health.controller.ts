import { APP_NAME, APP_VERSION } from '@constants';
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@noted/decorators/public.decorator';
import { HealthService } from '@noted/health/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Public()
	@Get()
	@ApiOperation({ summary: 'Liveness check, including a database ping' })
	@ApiResponse({ status: 200, description: 'The database answered' })
	@ApiResponse({ status: 503, description: 'The database is unreachable' })
	@HttpCode(HttpStatus.OK)
	public async check() {
		if (!(await this.healthService.isDatabaseReachable()))
			throw new ServiceUnavailableException('Database unreachable');

		return {
			status: 'ok',
			name: APP_NAME,
			version: APP_VERSION,
		};
	}
}
