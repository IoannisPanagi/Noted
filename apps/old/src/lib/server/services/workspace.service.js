import { error } from '@sveltejs/kit';
import bcrypt from 'bcrypt';
import {
	deleteWorkspace,
	getWorkspace,
	saveWorkspace,
} from '$lib/server/database/workspaces_repository.js';

export async function get(workspace) {
	const dbWorkspace = getWorkspace(workspace);

	if (dbWorkspace && dbWorkspace.password) {
		if (
			workspace.password &&
			(await bcrypt.compare(workspace.password, dbWorkspace.password))
		) {
			return dbWorkspace;
		} else throw error(403, 'You are unauthorized!');
	} else if (dbWorkspace) {
		return dbWorkspace;
	}

	return workspace;
}

export async function getFromPassphrase(passphrase) {
	return passphrase ? ((await get({ passphrase })) ?? { passphrase }) : null;
}

export function save(workspace) {
	if (workspace.password) {
		workspace.password = bcrypt.hashSync(workspace.password, 10);
	}

	saveWorkspace(workspace);
}

export function remove(workspace) {
	const dbWorkspace = getWorkspace(workspace);

	if (dbWorkspace && dbWorkspace.password) {
		if (bcrypt.compare(workspace.password, dbWorkspace.password)) {
			deleteWorkspace(workspace);
		}
	}
}
