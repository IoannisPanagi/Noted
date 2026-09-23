import { redirect } from '@sveltejs/kit';
import { logger } from '$lib/server/logger.js';
import { generateJws } from '$lib/server/services/jws.service.js';
import { get } from '$lib/server/services/workspace.service.js';

const jwtExpiry = parseInt(process.env.JWT_EXPIRY);

export async function load({ cookies, locals, params }) {
	logger.debug(
		`Attempting to load shortcut page, will try to load the ${params.passphrase} workspace`,
	);
	if (!params.passphrase) {
		if (locals.workspace?.passphrase) {
			throw redirect(303, '/notes');
		} else throw redirect(303, '/');
	}

	const dbWorkspace = await get({ passphrase: params.passphrase });

	cookies.set('noted-authentication', generateJws(dbWorkspace), {
		path: '/',
		expires: new Date(Date.now() + jwtExpiry),
		sameSite: 'strict',
	});

	throw redirect(303, '/notes');
}
