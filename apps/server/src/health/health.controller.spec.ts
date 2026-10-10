import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '@noted/health/health.controller';
import { HealthService } from '@noted/health/health.service';

describe('HealthController', () => {
	const isDatabaseReachable = jest.fn();
	let healthController: HealthController;

	beforeEach(async () => {
		isDatabaseReachable.mockReset();

		const module: TestingModule = await Test.createTestingModule({
			controllers: [HealthController],
			providers: [
				{ provide: HealthService, useValue: { isDatabaseReachable } },
			],
		}).compile();

		healthController = module.get<HealthController>(HealthController);
	});

	it('reports ok while the database answers', async () => {
		isDatabaseReachable.mockResolvedValue(true);

		await expect(healthController.check()).resolves.toMatchObject({
			status: 'ok',
		});
	});

	it('fails with 503 when the database is unreachable', async () => {
		isDatabaseReachable.mockResolvedValue(false);

		await expect(healthController.check()).rejects.toThrow(
			ServiceUnavailableException,
		);
	});
});
