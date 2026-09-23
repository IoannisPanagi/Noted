import { DrizzleModule } from '@drizzle/drizzle.module';
import { Module } from '@nestjs/common';
import { CategoriesController } from '@noted/categories/categories.controller';
import { CategoriesRepository } from '@noted/categories/categories.repository';
import { CategoriesService } from '@noted/categories/categories.service';
import { WorkspacesModule } from '@noted/workspaces/workspaces.module';

@Module({
	imports: [DrizzleModule, WorkspacesModule],
	providers: [CategoriesService, CategoriesRepository],
	controllers: [CategoriesController],
	exports: [CategoriesService],
})
export class CategoriesModule {}
