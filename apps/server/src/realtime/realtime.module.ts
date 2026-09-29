import { Module } from '@nestjs/common';
import { CategoriesModule } from '@noted/categories/categories.module';
import { NotesModule } from '@noted/notes/notes.module';
import { CategoriesListener } from '@noted/realtime/listeners/categories.listener';
import { NotesListener } from '@noted/realtime/listeners/notes.listener';
import { WorkspacesListener } from '@noted/realtime/listeners/workspaces.listener';
import { RealtimeGateway } from '@noted/realtime/realtime.gateway';
import { WorkspacesModule } from '@noted/workspaces/workspaces.module';

@Module({
	imports: [NotesModule, CategoriesModule, WorkspacesModule],
	providers: [
		RealtimeGateway,
		NotesListener,
		CategoriesListener,
		WorkspacesListener,
	],
	exports: [RealtimeGateway],
	controllers: [],
})
export class RealtimeModule {}
