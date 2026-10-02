import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function toTitleCase(str) {
	return str
		.toLowerCase()
		.replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
}

// Focuses an editable element with the caret after its last character
export function focusAtEnd(element) {
	element.focus();
	getSelection().selectAllChildren(element);
	getSelection().collapseToEnd();
}

// Enter on its own submits; Shift+Enter (and other modifiers) still add a new line
export function isPlainEnter(event) {
	return (
		event.key === 'Enter' &&
		!event.shiftKey &&
		!event.ctrlKey &&
		!event.altKey &&
		!event.metaKey
	);
}

// For a confirm dialog's onOpenAutoFocus: start on its action instead of Cancel,
// so Enter confirms and Esc (the dialog's own) backs out
export function focusAction(event, button) {
	event.preventDefault();
	button?.focus();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
