import { toast } from 'svelte-sonner';

const SHOW_COMPLETED_KEY = 'NOTED_SHOW_COMPLETED';

export function setShowCompleted(state) {
	try {
		localStorage.setItem(SHOW_COMPLETED_KEY, JSON.stringify(state));
	} catch (error) {
		toast.error(error);
	}
}

export function readShowCompleted() {
	try {
		return JSON.parse(localStorage.getItem(SHOW_COMPLETED_KEY));
	} catch (error) {
		toast.error(error);
	}
}
