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

export function focusAtEnd(element) {
	element.focus();
	getSelection().selectAllChildren(element);
	getSelection().collapseToEnd();
}

export function isPlainEnter(event) {
	return (
		event.key === 'Enter' &&
		!event.shiftKey &&
		!event.ctrlKey &&
		!event.altKey &&
		!event.metaKey
	);
}

// Confirm dialogs open on their action, so Enter confirms and Esc backs out
export function focusAction(event, button) {
	event.preventDefault();
	button?.focus();
}
