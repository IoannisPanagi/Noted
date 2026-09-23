import { INestApplication } from '@nestjs/common';
import { api, createTestApp, login } from './utils/test-app';

describe('Auth (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await app.close();
	});

	it('rejects a guarded route without a cookie', async () => {
		await api(app).get('/api/notes').expect(401);
	});

	it('rejects a guarded route with an invalid cookie', async () => {
		await api(app)
			.get('/api/notes')
			.set('Cookie', 'Noted-authentication=not-a-token')
			.expect(401);
	});

	it('logs in to an open workspace and reports it as authenticated', async () => {
		const cookie = await login(app, 'auth-open');

		await api(app)
			.get('/api/authenticated')
			.set('Cookie', cookie)
			.expect(200, { authenticated: true });
	});

	it('reports no authentication without a cookie', async () => {
		await api(app).get('/api/authenticated').expect(200, {
			authenticated: false,
		});
	});

	it('does not persist a workspace just because someone logged in', async () => {
		const cookie = await login(app, 'auth-untouched');

		await api(app).get('/api/notes').set('Cookie', cookie).expect(200, []);

		// Nothing entered it, so deleting it is a no-op rather than a 404
		await api(app).delete('/api/workspaces').set('Cookie', cookie).expect(204);
	});

	it('creates a locked workspace when a password is supplied', async () => {
		await login(app, 'auth-locked', 'secret');

		await api(app)
			.post('/api')
			.send({ passphrase: 'auth-locked', password: 'wrong' })
			.expect(401);

		await api(app)
			.post('/api')
			.send({ passphrase: 'auth-locked', password: null })
			.expect(401);

		await api(app)
			.post('/api')
			.send({ passphrase: 'auth-locked', password: 'secret' })
			.expect(200);
	});

	it('rejects a login without a passphrase', async () => {
		await api(app).post('/api').send({ password: null }).expect(400);
	});
});
