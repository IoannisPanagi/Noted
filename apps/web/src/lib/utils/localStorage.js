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

// Forgotten on logout, since it belongs to the workspace that was open
const ACTIVE_CATEGORY_KEY = 'NOTED_ACTIVE_CATEGORY';

export function setActiveCategory(id) {
	try {
		localStorage.setItem(ACTIVE_CATEGORY_KEY, JSON.stringify(id));
	} catch (error) {
		toast.error(error);
	}
}

export function readActiveCategory() {
	try {
		return JSON.parse(localStorage.getItem(ACTIVE_CATEGORY_KEY));
	} catch (error) {
		toast.error(error);
	}
}

export function removeActiveCategory() {
	try {
		localStorage.removeItem(ACTIVE_CATEGORY_KEY);
	} catch (error) {
		toast.error(error);
	}
}

// Whether notes show their toolbar buttons
const NOTE_BUTTONS_KEY = 'NOTED_NOTE_BUTTONS';

// state should be a boolean
export function setNoteButtons(state) {
	try {
		localStorage.setItem(NOTE_BUTTONS_KEY, JSON.stringify(state));
	} catch (error) {
		toast.error(error);
	}
}

export function readNoteButtons() {
	try {
		return JSON.parse(localStorage.getItem(NOTE_BUTTONS_KEY));
	} catch (error) {
		toast.error(error);
	}
}
