import { redirect } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';

export async function handle({ event, resolve }) {
	if (event.response.status === 403 || event.response.status === 401) {
		toast.error('Your session has expired.');

		throw redirect(303, '/');
	}

	return resolve(event);
}
