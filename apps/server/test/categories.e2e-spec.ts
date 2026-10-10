import { INestApplication } from '@nestjs/common';
import { api, createTestApp, login } from './utils/test-app';

describe('Categories (e2e)', () => {
	let app: INestApplication;
	let cookie: string;

	beforeAll(async () => {
		app = await createTestApp();
		cookie = await login(app, 'categories');
	});

	afterAll(async () => {
		await app.close();
	});

	it('creates, lists, updates and deletes a category', async () => {
		const created = await api(app)
			.post('/api/categories')
			.set('Cookie', cookie)
			.send({ label: '  Work ', description: 'day job' })
			.expect(201);

		// The label is trimmed and lowercased on the way in
		expect(created.body).toMatchObject({
			label: 'work',
			description: 'day job',
		});

		const listed = await api(app)
			.get('/api/categories')
			.set('Cookie', cookie)
			.expect(200);

		expect(listed.body).toEqual([created.body]);

		await api(app)
			.put(`/api/categories/${created.body.id}`)
			.set('Cookie', cookie)
			.send({ id: created.body.id, label: 'job', description: null })
			.expect(200, { ...created.body, label: 'job', description: null });

		await api(app)
			.delete(`/api/categories/${created.body.id}`)
			.set('Cookie', cookie)
			.expect(204);

		await api(app).get('/api/categories').set('Cookie', cookie).expect(200, []);
	});

	it('updates the description when the label already exists', async () => {
		const first = await api(app)
			.post('/api/categories')
			.set('Cookie', cookie)
			.send({ label: 'duplicate', description: 'first' })
			.expect(201);

		const second = await api(app)
			.post('/api/categories')
			.set('Cookie', cookie)
			.send({ label: 'duplicate', description: 'second' })
			.expect(201);

		expect(second.body).toEqual({ ...first.body, description: 'second' });
	});

	it('rejects an empty label', async () => {
		await api(app)
			.post('/api/categories')
			.set('Cookie', cookie)
			.send({ label: '' })
			.expect(400);
	});

	it('rejects a mismatch between the body id and the route id', async () => {
		await api(app)
			.put('/api/categories/some-id')
			.set('Cookie', cookie)
			.send({ id: 'another-id', label: 'whatever' })
			.expect(400);
	});

	it('hides categories belonging to another workspace', async () => {
		const otherCookie = await login(app, 'categories-other');
		const mine = await api(app)
			.post('/api/categories')
			.set('Cookie', cookie)
			.send({ label: 'private' })
			.expect(201);

		await api(app)
			.get('/api/categories')
			.set('Cookie', otherCookie)
			.expect(200, []);

		await api(app)
			.put(`/api/categories/${mine.body.id}`)
			.set('Cookie', otherCookie)
			.send({ id: mine.body.id, label: 'stolen' })
			.expect(404);

		await api(app)
			.delete(`/api/categories/${mine.body.id}`)
			.set('Cookie', otherCookie)
			.expect(404);
	});
});
