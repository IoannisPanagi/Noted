import { error, json } from '@sveltejs/kit';
import { sendMessage } from '$lib/server/clientList.js';
import {
	deleteCategory,
	saveCategory,
} from '$lib/server/database/catagories_repository.js';

export async function PUT({ params, request, locals }) {
	const workspace = locals.workspace;

	if (!workspace) {
		throw error(403, 'You are unauthorized');
	}

	const category = await request.json();

	if (category.id !== params.id) {
		throw error(400, 'Category label mismatch between URL and body');
	}

	const updatedCategory = saveCategory(workspace, category);

	sendMessage(locals.workspace.passphrase, 'updateCategory', updatedCategory);

	return json(updatedCategory);
}

export async function DELETE({ params, locals }) {
	const workspace = locals.workspace;

	if (!workspace) {
		throw error(403, 'You are unauthorized');
	}

	const success = deleteCategory(workspace, params.id);

	if (!success) {
		throw error(404, 'Category not found');
	}

	sendMessage(locals.workspace.passphrase, 'deleteCategory', params.id);

	return new Response(null, { status: 204 });
}
