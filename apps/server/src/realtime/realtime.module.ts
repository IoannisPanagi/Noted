import { Module } from '@nestjs/common';
import { AuthModule } from '@noted/auth/auth.module';
import { CategoriesModule } from '@noted/categories/categories.module';
import { NotesModule } from '@noted/notes/notes.module';
import { NotesService } from '@noted/notes/notes.service';
import { NotesListener } from '@noted/realtime/listeners/notes.listener';
import { RealtimeGateway } from '@noted/realtime/realtime.gateway';
import { TokensModule } from '@noted/tokens/tokens.module';
import { WorkspacesModule } from '@noted/workspaces/workspaces.module';

@Module({
	imports: [NotesModule, CategoriesModule, WorkspacesModule],
	providers: [
		RealtimeGateway,
		NotesListener,
	],
	exports: [RealtimeGateway],
	controllers: [],
})
export class RealtimeModule {}
