import { error, json } from '@sveltejs/kit';
import { sendMessage } from '$lib/server/clientList.js';
import { deleteNote, saveNote } from '$lib/server/database/notes_repository.js';

export async function PUT({ params, request, locals }) {
	const passphrase = locals.workspace.passphrase;

	if (!passphrase) {
		throw error(401, 'No passphrase provided');
	}

	const note = await request.json();

	if (note.id !== params.id) {
		throw error(400, 'Note ID mismatch between URL and body');
	}

	const updatedNote = saveNote(passphrase, note);

	sendMessage(locals.workspace.passphrase, 'updateNote', updatedNote);

	return json(updatedNote);
}

export async function DELETE({ params, locals }) {
	const passphrase = locals.workspace.passphrase;

	if (!passphrase) {
		throw error(401, 'No passphrase provided');
	}

	const success = deleteNote(passphrase, params.id);

	if (!success) {
		throw error(404, 'Note not found');
	}

	sendMessage(locals.workspace.passphrase, 'deleteNote', params.id);

	return new Response(null, { status: 204 });
}
