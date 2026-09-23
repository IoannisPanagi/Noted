import { error, fail, json } from '@sveltejs/kit';
import { generateJws } from '$lib/server/services/jws.service.js';
import { get } from '$lib/server/services/workspace.service.js';

const jwtExpiry = parseInt(process.env.JWT_EXPIRY);

export async function GET({ cookies }) {
	const token = await cookies.get('noted-authentication');

	if (!token) {
		return error(401, 'Not authenticated');
	}

	return json('Authenticated');
}

export async function POST({ request, cookies }) {
	try {
		const workspace = await request.json();

		const dbWorkspace = await get(workspace);

		cookies.set('noted-authentication', generateJws(dbWorkspace), {
			path: '/',
			expires: new Date(Date.now() + jwtExpiry),
			sameSite: 'strict',
		});

		return json('Authenticated');
	} catch {
		throw fail(401, { error: 'Invalid passphrase' });
	}
}

export async function DELETE({ cookies }) {
	cookies.delete('noted-authentication', { path: '/' });

	return new Response(null, { status: 204 });
}
