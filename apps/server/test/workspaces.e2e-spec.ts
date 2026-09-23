import { INestApplication } from '@nestjs/common';
import { api, createTestApp, login } from './utils/test-app';

describe('Workspaces (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		app = await createTestApp();
	});

	afterAll(async () => {
		await app.close();
	});

	const seed = async (cookie: string) => {
		const category = await api(app)
			.post('/api/categories')
			.set('Cookie', cookie)
			.send({ label: 'stuff' })
			.expect(201);

		await api(app)
			.post('/api/notes')
			.set('Cookie', cookie)
			.send({
				note: {
					text: 'something',
					backgroundColor: 'red',
					noteOrder: 1,
					categoryId: category.body.id,
				},
			})
			.expect(201);
	};

	it('deletes an open workspace with everything in it', async () => {
		const cookie = await login(app, 'workspace-open');
		await seed(cookie);

		await api(app).delete('/api/workspaces').set('Cookie', cookie).expect(204);

		// A fresh login sees an empty workspace
		const freshCookie = await login(app, 'workspace-open');
		await api(app).get('/api/notes').set('Cookie', freshCookie).expect(200, []);
		await api(app)
			.get('/api/categories')
			.set('Cookie', freshCookie)
			.expect(200, []);
	});

	it('requires the password to delete a locked workspace', async () => {
		const cookie = await login(app, 'workspace-locked', 'secret');
		await seed(cookie);

		await api(app).delete('/api/workspaces').set('Cookie', cookie).expect(401);

		await api(app)
			.delete('/api/workspaces')
			.set('Cookie', cookie)
			.send({ password: 'wrong' })
			.expect(401);

		await api(app)
			.delete('/api/workspaces')
			.set('Cookie', cookie)
			.send({ password: 'secret' })
			.expect(204);

		// The workspace is gone, so the passphrase is open again
		await api(app)
			.post('/api')
			.send({ passphrase: 'workspace-locked', password: null })
			.expect(200);
	});

	it('invalidates existing tokens once a workspace gains a password', async () => {
		const openCookie = await login(app, 'workspace-fingerprint');
		await seed(openCookie);

		await api(app).get('/api/notes').set('Cookie', openCookie).expect(200);

		// Deleting and re-creating it with a password changes the fingerprint
		await api(app)
			.delete('/api/workspaces')
			.set('Cookie', openCookie)
			.expect(204);
		await login(app, 'workspace-fingerprint', 'secret');

		await api(app).get('/api/notes').set('Cookie', openCookie).expect(401);
	});
});
