import { CORS_ORIGINS } from '@constants';
import { Inject } from '@nestjs/common';
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	WsException,
} from '@nestjs/websockets';
import { CategoriesService } from '@noted/categories/categories.service';
import { CreateCategoryDto } from '@noted/categories/dtos/createCategory.dto';
import { UpdateCategoryDto } from '@noted/categories/dtos/updateCategory.dto';
import { CategoryCreatedEvent } from '@noted/categories/events/categoryCreated.event';
import { CategoryDeletedEvent } from '@noted/categories/events/categoryDeleted';
import { CategoryUpdatedEvent } from '@noted/categories/events/categoryUpdated.event';
import { Passphrase } from '@noted/decorators/passphrase.ws.decorator';
import { CreateNoteDto } from '@noted/notes/dtos/createNote.dto';
import { UpdateNoteDto } from '@noted/notes/dtos/updateNote.dto';
import type { NoteCreatedEvent } from '@noted/notes/events/noteCreated.event';
import { NoteDeletedEvent } from '@noted/notes/events/noteDeleted.event';
import { NotesClearedEvent } from '@noted/notes/events/notesCleared.event';
import { NoteUpdatedEvent } from '@noted/notes/events/noteUpdated.event';
import { NotesService } from '@noted/notes/notes.service';
import { UpdateWorkspaceDto } from '@noted/workspaces/dtos/updateWorkspace.dto';
import { WorkspaceDestroyedEvent } from '@noted/workspaces/events/workspaceDestroyedEvent';
import { WorkspaceUpdatedEvent } from '@noted/workspaces/events/workspaceUpdated.event';
import { WorkspacesService } from '@noted/workspaces/workspaces.service';
import { Server, Socket } from 'socket.io';

// The websocket segment of the system will use singular naming over plural
// Because it reads better, no other reason
@WebSocketGateway({
	namespace: '/api/workspace',
	cors: { origin: CORS_ORIGINS, credentials: true },
})
export class RealtimeGateway {
	// Server exists because of the gateway initializing. It does not need a constructor
	@WebSocketServer()
	private server!: Server;

	// Service resolution handled by the DI of NestJS
	@Inject()
	private notesService!: NotesService;

	@Inject()
	private categoriesService!: CategoriesService;

	@Inject()
	private workspacesService!: WorkspacesService;

	//* Joining the workspace via passing through the guard *//
	@SubscribeMessage('join.workspace')
	async joinWorkspace(
		@ConnectedSocket() client: Socket,
		@Passphrase() passphrase: string,
	) {
		client.join(passphrase);
	}

	//* Get notes and categories *//
	// Like GET /api/notes: completed narrows to complete/incomplete notes, and
	// omitted returns both
	@SubscribeMessage('list.notes')
	async listNotes(
		@Passphrase() passphrase: string,
		@MessageBody('completed') isCompleted?: boolean,
		@MessageBody('categoryLabel') categoryLabel?: string | null,
	) {
		return {
			ok: true,
			data: categoryLabel
				? await this.notesService.findAllByPassphraseAndCategoryLabel(
						passphrase,
						categoryLabel,
						isCompleted,
					)
				: await this.notesService.findAllByPassphrase(passphrase, isCompleted),
		};
	}

	@SubscribeMessage('list.categories')
	async listCategories(@Passphrase() passphrase: string) {
		return {
			ok: true,
			data: await this.categoriesService.findAllByPassphrase(passphrase),
		};
	}

	//* Note CUD events from clients *//
	@SubscribeMessage('add.note')
	async addNote(
		@Passphrase() passphrase: string,
		@MessageBody('note') note: CreateNoteDto,
	) {
		return { ok: true, data: await this.notesService.create(note, passphrase) };
	}

	@SubscribeMessage('update.note')
	async updateNote(
		@Passphrase() passphrase: string,
		@MessageBody('note') note: UpdateNoteDto,
	) {
		return { ok: true, data: await this.notesService.update(note, passphrase) };
	}

	@SubscribeMessage('delete.note')
	async deleteNote(
		@Passphrase() passphrase: string,
		@MessageBody('id') id: string,
	) {
		if (!id) throw new WsException('Id is required');

		const deleted = await this.notesService.delete(passphrase, id);
		if (!deleted) return { ok: false, error: 'Not Found' };
		return { ok: true, data: deleted };
	}

	@SubscribeMessage('clear.notes')
	async clearNotes(@Passphrase() passphrase: string) {
		await this.notesService.deleteAllByPassphrase(passphrase);
		return { ok: true };
	}

	//* Category CUD events from clients *//
	@SubscribeMessage('add.category')
	async addCategory(
		@Passphrase() passphrase: string,
		@MessageBody('category') category: CreateCategoryDto,
	) {
		return {
			ok: true,
			data: await this.categoriesService.create(category, passphrase),
		};
	}

	@SubscribeMessage('update.category')
	async updateCategory(
		@Passphrase() passphrase: string,
		@MessageBody('category') category: UpdateCategoryDto,
	) {
		return {
			ok: true,
			data: await this.categoriesService.update(category, passphrase),
		};
	}

	@SubscribeMessage('delete.category')
	async deleteCategory(
		@Passphrase() passphrase: string,
		@MessageBody('id') id: string,
	) {
		if (!id) throw new WsException('Id is required');

		const deleted = await this.categoriesService.delete(passphrase, id);
		if (!deleted) return { ok: false, error: 'Not Found' };
		return { ok: true, data: deleted };
	}

	//* Workspace update events from clients *//
	@SubscribeMessage('update.workspace')
	async updateWorkspace(
		@Passphrase() passphrase: string,
		@MessageBody('workspace') workspace: UpdateWorkspaceDto,
	) {
		const updatedWorkspace = await this.workspacesService.update(
			workspace,
			passphrase,
		);

		return {
			ok: true,
			data: { ...updatedWorkspace, password: null },
		};
	}

	//* Listener emitters *//
	//* Notes *//
	async emitNoteCreated(event: NoteCreatedEvent) {
		this.server.to(event.passphrase).emit('note.created', event.note);
	}

	async emitNoteUpdated(event: NoteUpdatedEvent) {
		this.server.to(event.passphrase).emit('note.updated', event.note);
	}

	async emitNoteDeleted(event: NoteDeletedEvent) {
		this.server.to(event.passphrase).emit('note.deleted', event.noteId);
	}

	async emitNotesCleared(event: NotesClearedEvent) {
		this.server.to(event.passphrase).emit('notes.cleared');
	}

	//* Categories *//
	async emitCategoryCreated(event: CategoryCreatedEvent) {
		this.server.to(event.passphrase).emit('category.created', event.category);
	}

	async emitCategoryUpdated(event: CategoryUpdatedEvent) {
		this.server.to(event.passphrase).emit('category.updated', event.category);
	}

	async emitCategoryDeleted(event: CategoryDeletedEvent) {
		this.server.to(event.passphrase).emit('category.deleted', event.id);
	}

	//* Workspaces *//
	async emitWorkspaceUpdated(event: WorkspaceUpdatedEvent) {
		this.server.to(event.passphrase).emit('auth.refresh', event.passphrase);
		this.server.to(event.passphrase).emit('workspace.updated', event.workspace);
	}

	async emitWorkspaceDestroyed(event: WorkspaceDestroyedEvent) {
		this.server
			.to(event.passphrase)
			.emit('workspace.destroyed', event.passphrase);
		this.server.in(event.passphrase).disconnectSockets(true);
	}
}
