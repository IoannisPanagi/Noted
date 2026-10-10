import { Note } from '@noted/types';

export type NoteCreatedEvent = {
	note: Note;
	passphrase: string;
};
