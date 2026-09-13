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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
