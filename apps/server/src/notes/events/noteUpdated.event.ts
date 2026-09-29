import { Note } from '@noted/types';

export type NoteUpdatedEvent = {
	note: Note;
	passphrase: string;
};
