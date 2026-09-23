import { Test, TestingModule } from '@nestjs/testing';
import { HealthRepository } from '@noted/health/health.repository';
import { HealthService } from '@noted/health/health.service';

describe('HealthService', () => {
	const ping = jest.fn();
	let healthService: HealthService;

	beforeEach(async () => {
		ping.mockReset();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				HealthService,
				{ provide: HealthRepository, useValue: { ping } },
			],
		}).compile();

		healthService = module.get<HealthService>(HealthService);
	});

	it('reports the database as reachable when the ping succeeds', async () => {
		ping.mockResolvedValue(undefined);

		await expect(healthService.isDatabaseReachable()).resolves.toBe(true);
	});

	it('reports the database as unreachable when the ping throws', async () => {
		ping.mockRejectedValue(new Error('database is locked'));

		await expect(healthService.isDatabaseReachable()).resolves.toBe(false);
	});
});
