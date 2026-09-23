import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
	const { passphrase } = await request.json();

	if (!passphrase || passphrase.trim().length === 0) {
		return json({ error: 'No passphrase provided' }, { status: 400 });
	}

	cookies.set('passphrase', passphrase, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 * 30,
	});

	return json({ success: true });
}

export async function GET({ cookies }) {
	const passphrase = cookies.get('passphrase');

	return json({
		hasPassphrase: Boolean(passphrase),
	});
}
