import { INestApplication } from '@nestjs/common';
import { api, createTestApp } from './utils/test-app';

describe('Health (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await app.close();
	});

	it('answers without authentication', async () => {
		const response = await api(app).get('/api/health').expect(200);

		expect(response.body).toMatchObject({ status: 'ok' });
	});
});
