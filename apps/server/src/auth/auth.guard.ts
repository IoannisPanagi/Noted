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
	UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokensService } from '@noted/tokens/tokens.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly logger = new Logger(AuthGuard.name);

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

		const request: Request = context.switchToHttp().getRequest();
		try {
			const token = request.cookies[APP_AUTH_COOKIE_NAME] as string;

			// Throwing (rather than returning false, which Nest turns into a 403)
			// keeps a missing cookie and an invalid one on the same 401
			if (!token) throw new UnauthorizedException();

			request[APP_WORKSPACE_LOCAL_NAME] =
				await this.tokensService.validateToken(token);

			return true;
		} catch {
			this.logger.debug(
				`Rejected ${request.method} ${request.url}: no valid session cookie`,
			);

			throw new UnauthorizedException();
		}
	}
}
