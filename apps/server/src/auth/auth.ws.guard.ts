import {
	APP_AUTH_COOKIE_NAME,
	APP_WORKSPACE_LOCAL_NAME,
	IS_PUBLIC_KEY,
} from '@constants';
import {
	CanActivate,
	ExecutionContext,
	Injectable,
	Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WsException } from '@nestjs/websockets';
import { TokensService } from '@noted/tokens/tokens.service';
import * as cookie from 'cookie';
import { Socket } from 'socket.io';

@Injectable()
export class AuthWsGuard implements CanActivate {
	private readonly logger = new Logger(AuthWsGuard.name);

	constructor(
		private readonly tokensService: TokensService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (isPublic) {
			return true;
		}

		const client = context.switchToWs().getClient<Socket>();
		try {
			const cookies = cookie.parseCookie(client.handshake.headers.cookie ?? '');

			if (!cookies) return false;

			const token = cookies[APP_AUTH_COOKIE_NAME];

			if (!token) return false;

			client.data[APP_WORKSPACE_LOCAL_NAME] =
				await this.tokensService.validateToken(token);

			return true;
		} catch {
			this.logger.debug(
				`Rejected websocket connection: no valid session cookie`,
			);

			throw new WsException('Unauthorized');
		}
	}
}
