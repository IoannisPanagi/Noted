import { INestApplication } from '@nestjs/common';
import { api, createTestApp, login } from './utils/test-app';

describe('Notes (e2e)', () => {
	let app: INestApplication;
	let cookie: string;

	const createNote = (note: Record<string, unknown>, withCookie = cookie) =>
		api(app).post('/api/notes').set('Cookie', withCookie).send({ note });

	beforeAll(async () => {
		app = await createTestApp();
		cookie = await login(app, 'notes');
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await api(app).delete('/api/notes').set('Cookie', cookie).expect(204);
	});

	it('creates an uncategorised note', async () => {
		const created = await createNote({
			text: 'plain',
			backgroundColor: 'red',
			noteOrder: 1,
		}).expect(201);

		expect(created.body).toMatchObject({
			text: 'plain',
			categoryId: null,
			isCompleted: false,
			passphrase: 'notes',
		});
	});

	it('creates a note in a category and lists it by label', async () => {
		const category = await api(app)
			.post('/api/categories')
			.set('Cookie', cookie)
			.send({ label: 'errands' })
			.expect(201);

		const created = await createNote({
			text: 'milk',
			backgroundColor: 'red',
			noteOrder: 1,
			categoryId: category.body.id,
		}).expect(201);

		await api(app)
			.get('/api/notes/category/errands')
			.set('Cookie', cookie)
			.expect(200, [created.body]);
	});

	it('fetches one note by id', async () => {
		const created = await createNote({
			text: 'fetch me',
			backgroundColor: 'red',
			noteOrder: 1,
		}).expect(201);

		await api(app)
			.get(`/api/notes/${created.body.id}`)
			.set('Cookie', cookie)
			.expect(200, created.body);
	});

	it('updates a note, including its text', async () => {
		const created = await createNote({
			text: 'before',
			backgroundColor: 'red',
			noteOrder: 1,
		}).expect(201);

		const { passphrase, ...note } = created.body;

		const updated = await api(app)
			.put(`/api/notes/${created.body.id}`)
			.set('Cookie', cookie)
			.send({ note: { ...note, text: 'after', backgroundColor: 'blue' } })
			.expect(200);

		expect(updated.body).toMatchObject({
			text: 'after',
			backgroundColor: 'blue',
		});
	});

	it('filters by completion state', async () => {
		const open = await createNote({
			text: 'open',
			backgroundColor: 'red',
			noteOrder: 1,
		}).expect(201);
		const done = await createNote({
			text: 'done',
			backgroundColor: 'red',
			noteOrder: 2,
		}).expect(201);

		const { passphrase, ...note } = done.body;
		await api(app)
			.put(`/api/notes/${done.body.id}`)
			.set('Cookie', cookie)
			.send({
				note: {
					...note,
					isCompleted: true,
					completedAt: new Date().toISOString(),
				},
			})
			.expect(200);

		const all = await api(app)
			.get('/api/notes')
			.set('Cookie', cookie)
			.expect(200);
		expect(all.body).toHaveLength(2);

		const complete = await api(app)
			.get('/api/notes?complete=true')
			.set('Cookie', cookie)
			.expect(200);
		expect(complete.body.map((n: { text: string }) => n.text)).toEqual([
			'done',
		]);

		const incomplete = await api(app)
			.get('/api/notes?complete=false')
			.set('Cookie', cookie)
			.expect(200);
		expect(incomplete.body.map((n: { text: string }) => n.text)).toEqual([
			open.body.text,
		]);
	});

	it('rejects a non-boolean completion filter', async () => {
		await api(app)
			.get('/api/notes?complete=maybe')
			.set('Cookie', cookie)
			.expect(400);
	});

	it('rejects a note without text', async () => {
		await createNote({ backgroundColor: 'red', noteOrder: 1 }).expect(400);
	});

	it('deletes one note', async () => {
		const created = await createNote({
			text: 'temporary',
			backgroundColor: 'red',
			noteOrder: 1,
		}).expect(201);

		await api(app)
			.delete(`/api/notes/${created.body.id}`)
			.set('Cookie', cookie)
			.expect(204);

		await api(app)
			.delete(`/api/notes/${created.body.id}`)
			.set('Cookie', cookie)
			.expect(404);
	});

	it("keeps notes out of another workspace's reach", async () => {
		const otherCookie = await login(app, 'notes-other');
		const mine = await createNote({
			text: 'mine',
			backgroundColor: 'red',
			noteOrder: 1,
		}).expect(201);

		await api(app).get('/api/notes').set('Cookie', otherCookie).expect(200, []);

		await api(app)
			.get(`/api/notes/${mine.body.id}`)
			.set('Cookie', otherCookie)
			.expect(404);

		const { passphrase, ...note } = mine.body;
		await api(app)
			.put(`/api/notes/${mine.body.id}`)
			.set('Cookie', otherCookie)
			.send({ note: { ...note, backgroundColor: 'hacked' } })
			.expect(404);

		await api(app)
			.delete(`/api/notes/${mine.body.id}`)
			.set('Cookie', otherCookie)
			.expect(404);
	});

	it('rejects a category belonging to another workspace', async () => {
		const otherCookie = await login(app, 'notes-other-category');
		const theirCategory = await api(app)
			.post('/api/categories')
			.set('Cookie', otherCookie)
			.send({ label: 'theirs' })
			.expect(201);

		await createNote({
			text: 'sneaky',
			backgroundColor: 'red',
			noteOrder: 1,
			categoryId: theirCategory.body.id,
		}).expect(400);
	});

	it('clears every note in the workspace but keeps its categories', async () => {
		await createNote({
			text: 'a',
			backgroundColor: 'red',
			noteOrder: 1,
		}).expect(201);
		await createNote({
			text: 'b',
			backgroundColor: 'red',
			noteOrder: 2,
		}).expect(201);

		await api(app).delete('/api/notes').set('Cookie', cookie).expect(204);

		await api(app).get('/api/notes').set('Cookie', cookie).expect(200, []);

		const categories = await api(app)
			.get('/api/categories')
			.set('Cookie', cookie)
			.expect(200);
		expect(categories.body.length).toBeGreaterThan(0);
	});
});
