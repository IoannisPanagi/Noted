import { error, json } from '@sveltejs/kit';
import { sendMessage } from '$lib/server/clientList.js';
import {
	getCategoriesByPassphrase,
	saveCategory,
} from '$lib/server/database/catagories_repository.js';

export async function GET({ locals }) {
	return json(getCategoriesByPassphrase(locals.workspace?.passphrase));
}

export async function POST({ request, locals }) {
	const workspace = locals.workspace;

	if (!workspace) {
		throw error(404, `Workspace not found`);
	}

	const category = await request.json();

	if (!category?.label) {
		throw error(404, `Category label not found`);
	}

	if (!category?.description) {
		category.description = null;
	}

	const savedCategory = await saveCategory(workspace, category);

	sendMessage(locals.workspace.passphrase, 'newCategory', savedCategory);

	return json(savedCategory);
}
