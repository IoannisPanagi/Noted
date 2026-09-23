import {
	APP_AUTH_COOKIE_NAME,
	APP_NAME,
	APP_PORT,
	APP_VERSION,
	CORS_ORIGINS,
	LOG_LEVEL,
} from '@constants';
import { ConsoleLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { logLevelsFor } from '@noted/logging/log-levels';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
	const logger = new ConsoleLogger({
		prefix: APP_NAME,
		logLevels: logLevelsFor(LOG_LEVEL),
	});

	const app = await NestFactory.create(AppModule, {
		logger,
	});
	app.setGlobalPrefix('api');

	app.use(cookieParser());

	// The auth cookie travels cross-origin once the web app is served separately
	if (CORS_ORIGINS.length > 0)
		app.enableCors({
			origin: CORS_ORIGINS,
			credentials: true,
		});

	const documentBuilder = new DocumentBuilder()
		.setTitle(APP_NAME)
		.setDescription(`${APP_NAME} API`)
		.setVersion(APP_VERSION)
		.addCookieAuth(APP_AUTH_COOKIE_NAME)
		.build();

	// useGlobalPrefix keeps the docs under the same /api prefix as the routes
	SwaggerModule.setup(
		'docs',
		app,
		() => SwaggerModule.createDocument(app, documentBuilder),
		{
			useGlobalPrefix: true,
		},
	);

	logger.log(
		`[${APP_NAME}] ${APP_VERSION} listening on port ${APP_PORT}` +
			(CORS_ORIGINS.length > 0
				? `, accepting credentialed requests from ${CORS_ORIGINS.join(', ')}`
				: ''),
	);

	await app.listen(APP_PORT);

	logger.debug(`Log level is '${LOG_LEVEL}'`);
	logger.log(`API documentation available at /api/docs`);
}

void bootstrap();
