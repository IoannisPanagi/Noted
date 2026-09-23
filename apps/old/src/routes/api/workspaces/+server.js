import { error, json } from '@sveltejs/kit';
import { sendMessage } from '$lib/server/clientList.js';
import { save } from '$lib/server/services/workspace.service.js';

export async function POST({ request, locals }) {
	const { description, password } = await request.json();

	if (!description) throw error(400, 'Missing description');

	const workspace = locals.workspace;
	workspace.description = description;
	workspace.password = password;

	save(workspace);

	sendMessage(locals.workspace.passphrase, 'updateWorkspace', {
		...workspace,
		description,
		password: undefined,
	});

	return json({
		...workspace,
		password: undefined,
	});
}
