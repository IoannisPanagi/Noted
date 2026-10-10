import { DrizzleModule } from '@drizzle/drizzle.module';
import { Module } from '@nestjs/common';
import { WorkspacesController } from '@noted/workspaces/workspaces.controller';
import { WorkspacesRepository } from '@noted/workspaces/workspaces.repository';
import { WorkspacesService } from '@noted/workspaces/workspaces.service';

@Module({
	imports: [DrizzleModule],
	providers: [WorkspacesService, WorkspacesRepository],
	controllers: [WorkspacesController],
	exports: [WorkspacesService],
})
export class WorkspacesModule {}
