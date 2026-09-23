import { DrizzleModule } from '@drizzle/drizzle.module';
import { Module } from '@nestjs/common';
import { AuthModule } from '@noted/auth/auth.module';
import { CategoriesModule } from '@noted/categories/categories.module';
import { HealthModule } from '@noted/health/health.module';
import { NotesModule } from '@noted/notes/notes.module';
import { WorkspacesModule } from '@noted/workspaces/workspaces.module';

@Module({
	imports: [
		DrizzleModule,
		WorkspacesModule,
		CategoriesModule,
		NotesModule,
		AuthModule,
		HealthModule,
	],
})
export class AppModule {}
