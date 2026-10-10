import { DrizzleModule } from '@drizzle/drizzle.module';
import { Module } from '@nestjs/common';
import { CategoriesModule } from '@noted/categories/categories.module';
import { NotesController } from '@noted/notes/notes.controller';
import { NotesRepository } from '@noted/notes/notes.repository';
import { NotesService } from '@noted/notes/notes.service';
import { WorkspacesModule } from '@noted/workspaces/workspaces.module';

@Module({
	imports: [DrizzleModule, CategoriesModule, WorkspacesModule],
	providers: [NotesService, NotesRepository],
	controllers: [NotesController],
	exports: [NotesService],
})
export class NotesModule {}
