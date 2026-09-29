import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { CategoryCreatedEvent } from '@noted/categories/events/categoryCreated.event';
import type { CategoryDeletedEvent } from '@noted/categories/events/categoryDeleted';
import type { CategoryUpdatedEvent } from '@noted/categories/events/categoryUpdated.event';
import { RealtimeGateway } from '@noted/realtime/realtime.gateway';

@Injectable()
export class CategoriesListener {
	constructor(private readonly gateway: RealtimeGateway) {}

	@OnEvent('category.created', { async: true })
	async handleCategoryCreated(event: CategoryCreatedEvent) {
		await this.gateway.emitCategoryCreated(event);
	}

	@OnEvent('category.updated', { async: true })
	async handleCategoryUpdated(event: CategoryUpdatedEvent) {
		await this.gateway.emitCategoryUpdated(event);
	}

	@OnEvent('category.deleted', { async: true })
	async handleCategoryDeleted(event: CategoryDeletedEvent) {
		await this.gateway.emitCategoryDeleted(event);
	}
}
