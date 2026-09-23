import {APP_NAME, LOG_LEVEL} from '@constants';
import { DrizzleModule } from '@drizzle/drizzle.module';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthModule } from '@noted/auth/auth.module';
import { CategoriesModule } from '@noted/categories/categories.module';
import { HealthModule } from '@noted/health/health.module';
import { NotesModule } from '@noted/notes/notes.module';
import { WorkspacesModule } from '@noted/workspaces/workspaces.module';
import { LoggerModule } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod';

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: {
				level: LOG_LEVEL,
				// The auth cookie is a JWT whose payload carries the workspace
				// passphrase, a credential that must never reach the logs
				redact: ['req.headers.cookie', 'res.headers["set-cookie"]'],
				transport:
					process.env.NODE_ENV === 'test'
						? undefined
						: { target: 'pino-pretty', options: {
							colorize: true,
							singleLine: true,
							ignore: 'context,pid,hostname',
							messageFormat: `\x1b[32m[${APP_NAME}]\x1b[36m [{context}]\x1b[0m {msg}`
							}
							},
			},
		}),
		DrizzleModule,
		WorkspacesModule,
		CategoriesModule,
		NotesModule,
		AuthModule,
		HealthModule,
	],
	providers: [
		{ provide: APP_PIPE, useClass: ZodValidationPipe },
		{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
	],
})
export class AppModule {}
