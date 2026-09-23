import { APP_AUTH_COOKIE_NAME, DEFAULT_COOKIE_SETTINGS } from '@constants';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	Res,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '@noted/auth/auth.service';
import { LoginReqDto } from '@noted/auth/dtos/loginReq.dto';
import { Public } from '@noted/decorators/public.decorator';
import { TokenResDto } from '@noted/notes/dtos/tokenRes.dto';
import { TokensService } from '@noted/tokens/tokens.service';
import type { Request, Response } from 'express';
import { ZodResponse } from 'nestjs-zod';

@ApiTags('auth')
@Controller()
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly tokensService: TokensService,
	) {}

	@Public()
	@Get('/authenticated')
	@ApiOperation({
		summary: 'Whether the current cookie identifies a workspace',
	})
	@ApiResponse({ status: 200, description: '{ authenticated: true | false }' })
	@HttpCode(HttpStatus.OK)
	async authenticated(@Req() req: Request) {
		const token = req.cookies[APP_AUTH_COOKIE_NAME] as string;

		if (!token) return { authenticated: false };

		try {
			await this.tokensService.validateToken(token);

			return { authenticated: true };
		} catch {
			// Any reason the token doesn't validate is reported the same way -
			// this endpoint answers one question and always answers it
			return { authenticated: false };
		}
	}

	@Public()
	@Post('/login')
	@ApiOperation({
		summary: 'Log in to a workspace and receive the auth cookie',
		description:
			'A workspace that does not exist is only created when a password is supplied; otherwise it is persisted once a note or category enters it.',
	})
	@ZodResponse({
		status: HttpStatus.OK,
		description: 'Authenticated; cookie set',
		type: TokenResDto,
	})
	@ApiResponse({
		status: 401,
		description: 'Workspace is locked and the password did not match',
	})
	async login(
		@Body() req: LoginReqDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<TokenResDto> {
		const token = await this.authService.login(req);

		res.cookie(APP_AUTH_COOKIE_NAME, token.token, DEFAULT_COOKIE_SETTINGS);

		return token;
	}

	@Delete('/logout')
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiCookieAuth()
	@ApiOperation({ summary: 'Log out by clearing the auth cookie' })
	async logout(@Res({ passthrough: true }) res: Response) {
		// clearCookie drops maxAge, which would otherwise override expires and keep the cookie alive
		res.clearCookie(APP_AUTH_COOKIE_NAME, DEFAULT_COOKIE_SETTINGS);

		return;
	}
}
