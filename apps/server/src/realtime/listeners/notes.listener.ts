import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { NoteCreatedEvent } from '@noted/notes/events/noteCreated.event';
import { RealtimeGateway } from '@noted/realtime/realtime.gateway';

@Injectable()
export class NotesListener {
	constructor(private readonly gateway: RealtimeGateway) {}

	@OnEvent('note.created', { async: true })
	async handleNoteCreated(event: NoteCreatedEvent) {
		await this.gateway.emitNoteCreated(event);
	}
}
