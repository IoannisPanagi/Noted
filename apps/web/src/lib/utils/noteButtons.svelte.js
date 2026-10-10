import { readNoteButtons, setNoteButtons } from './localStorage.js';

// Shared so the header toggle updates every note on screen
export const noteButtons = $state({ active: readNoteButtons() ?? true });

export function toggleNoteButtons() {
	noteButtons.active = !noteButtons.active;
	setNoteButtons(noteButtons.active);
}
