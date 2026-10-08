import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RealtimeGateway } from '@noted/realtime/realtime.gateway';
import type { WorkspaceDestroyedEvent } from '@noted/workspaces/events/workspaceDestroyed.event';
import type { WorkspaceUpdatedEvent } from '@noted/workspaces/events/workspaceUpdated.event';

@Injectable()
export class WorkspacesListener {
	constructor(private readonly gateway: RealtimeGateway) {}

	@OnEvent('workspace.updated', { async: true })
	async handleWorkspaceUpdated(event: WorkspaceUpdatedEvent) {
		await this.gateway.emitWorkspaceUpdated(event);
	}

	@OnEvent('workspace.destroyed', { async: true })
	async handleWorkspaceDestroyed(event: WorkspaceDestroyedEvent) {
		await this.gateway.emitWorkspaceDestroyed(event);
	}
}
