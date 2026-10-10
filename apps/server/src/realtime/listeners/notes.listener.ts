import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { NoteCreatedEvent } from '@noted/notes/events/noteCreated.event';
import type { NoteDeletedEvent } from '@noted/notes/events/noteDeleted.event';
import type { NotesClearedEvent } from '@noted/notes/events/notesCleared.event';
import type { NoteUpdatedEvent } from '@noted/notes/events/noteUpdated.event';
import { RealtimeGateway } from '@noted/realtime/realtime.gateway';

@Injectable()
export class NotesListener {
	constructor(private readonly gateway: RealtimeGateway) {}

	@OnEvent('note.created', { async: true })
	async handleNoteCreated(event: NoteCreatedEvent) {
		await this.gateway.emitNoteCreated(event);
	}

	@OnEvent('note.updated', { async: true })
	async handleNoteUpdated(event: NoteUpdatedEvent) {
		await this.gateway.emitNoteUpdated(event);
	}

	@OnEvent('note.deleted', { async: true })
	async handleNoteDeleted(event: NoteDeletedEvent) {
		await this.gateway.emitNoteDeleted(event);
	}

	@OnEvent('notes.cleared', { async: true })
	async handleNotesCleared(event: NotesClearedEvent) {
		await this.gateway.emitNotesCleared(event);
	}
}
