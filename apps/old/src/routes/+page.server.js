import { redirect } from '@sveltejs/kit';
import { generateJws } from '$lib/server/services/jws.service.js';
import { get } from '$lib/server/services/workspace.service.js';

const jwtExpiry = parseInt(process.env.JWT_EXPIRY);

export async function load({ locals, cookies }) {
	if (cookies.get('noted-authentication')) throw redirect(303, '/notes');

	if (locals.workspace?.passphrase) {
		throw redirect(303, '/notes');
	}
}

export const actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const workspace = {
			passphrase: formData.get('passphrase'),
			password: formData.get('password'),
		};

		const dbWorkspace = await get(workspace);

		cookies.set('noted-authentication', generateJws(dbWorkspace), {
			path: '/',
			expires: new Date(Date.now() + jwtExpiry),
			sameSite: 'strict',
		});

		throw redirect(303, '/notes');
	},
};
