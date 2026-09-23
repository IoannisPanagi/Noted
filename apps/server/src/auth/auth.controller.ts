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
	UsePipes,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '@noted/auth/auth.service';
import {
	type LoginReqDto,
	LoginReqSchema,
} from '@noted/auth/dtos/loginReq.dto';
import { Public } from '@noted/decorators/public.decorator';
import type { TokenResDto } from '@noted/notes/dtos/tokenRes.dto';
import { ApiZodBody } from '@noted/openapi/zod-body.decorator';
import { ZodValidationPipe } from '@noted/pipes/zod-validation.pipe';
import { TokensService } from '@noted/tokens/tokens.service';
import type { Request, Response } from 'express';

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
	@Post()
	@ApiOperation({
		summary: 'Log in to a workspace and receive the auth cookie',
		description:
			'A workspace that does not exist is only created when a password is supplied; otherwise it is persisted once a note or category enters it.',
	})
	@ApiZodBody(LoginReqSchema)
	@ApiResponse({ status: 200, description: 'Authenticated; cookie set' })
	@ApiResponse({
		status: 401,
		description: 'Workspace is locked and the password did not match',
	})
	@HttpCode(HttpStatus.OK)
	@UsePipes(new ZodValidationPipe(LoginReqSchema))
	async login(
		@Body() req: LoginReqDto,
		@Res({ passthrough: true }) res: Response,
	): Promise<TokenResDto> {
		const token = await this.authService.login(req);

		res.cookie(APP_AUTH_COOKIE_NAME, token.token, DEFAULT_COOKIE_SETTINGS);

		return token;
	}

	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiCookieAuth()
	@ApiOperation({ summary: 'Log out by clearing the auth cookie' })
	async logout(@Res({ passthrough: true }) res: Response) {
		// clearCookie drops maxAge, which would otherwise override expires and keep the cookie alive
		res.clearCookie(APP_AUTH_COOKIE_NAME, DEFAULT_COOKIE_SETTINGS);

		return;
	}
}
