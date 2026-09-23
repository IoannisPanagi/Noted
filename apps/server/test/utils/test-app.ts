import { APP_AUTH_COOKIE_NAME } from '@constants';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@noted/app.module';
import cookieParser from 'cookie-parser';
import request from 'supertest';

// Mirrors the parts of main.ts that affect routing, so specs exercise the
// same paths and cookie handling a real client sees
export async function createTestApp(): Promise<INestApplication> {
	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	const app = moduleRef.createNestApplication();
	app.setGlobalPrefix('api');
	app.use(cookieParser());

	await app.init();

	return app;
}

export const api = (app: INestApplication) => request(app.getHttpServer());

// Logs in and returns the auth cookie, ready for .set('Cookie', …)
export async function login(
	app: INestApplication,
	passphrase: string,
	password: string | null = null,
): Promise<string> {
	const response = await api(app)
		.post('/api')
		.send({ passphrase, password })
		.expect(200);

	const setCookie = response.headers['set-cookie'];
	const cookie = (Array.isArray(setCookie) ? setCookie : [setCookie])
		.map((value) => value.split(';')[0])
		.find((value) => value.startsWith(`${APP_AUTH_COOKIE_NAME}=`));

	if (!cookie) throw new Error('login did not set an auth cookie');

	return cookie;
}
