import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from '@noted/auth/auth.controller';
import { AuthGuard } from '@noted/auth/auth.guard';
import { AuthService } from '@noted/auth/auth.service';
import { TokensModule } from '@noted/tokens/tokens.module';
import { WorkspacesModule } from '@noted/workspaces/workspaces.module';

@Module({
	imports: [TokensModule, WorkspacesModule],
	providers: [
		AuthService,
		{
			// Auto mount onto the NestJS app the guard as global
			provide: APP_GUARD,
			useClass: AuthGuard,
		},
	],
	exports: [AuthService],
	controllers: [AuthController],
})
export class AuthModule {}
