import { APP_AUTH_COOKIE_NAME, DEFAULT_COOKIE_SETTINGS } from '@constants';
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	Res,
	UsePipes,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { Passphrase } from '@noted/decorators/passphrase.decorator';
import { ApiZodBody } from '@noted/openapi/zod-body.decorator';
import { ZodValidationPipe } from '@noted/pipes/zod-validation.pipe';
import {
	type DeleteWorkspaceDto,
	DeleteWorkspaceSchema,
} from '@noted/workspaces/dtos/deleteWorkspace.dto';
import { WorkspacesService } from '@noted/workspaces/workspaces.service';
import type { Response } from 'express';

@ApiTags('workspaces')
@ApiCookieAuth()
@Controller('workspaces')
export class WorkspacesController {
	constructor(private readonly workspacesService: WorkspacesService) {}

	// Deletes the workspace entry entirely - notes, categories and the row itself
	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Delete the workspace entirely',
		description:
			'Removes its notes, categories and the workspace row, and clears the auth cookie. A locked workspace must confirm its password.',
	})
	@ApiZodBody(DeleteWorkspaceSchema)
	@ApiResponse({
		status: 401,
		description: 'Workspace is locked and the password did not match',
	})
	@UsePipes(new ZodValidationPipe(DeleteWorkspaceSchema))
	public async delete(
		@Body() workspaceDto: DeleteWorkspaceDto,
		@Passphrase() passphrase: string,
		@Res({ passthrough: true }) res: Response,
	) {
		if (!passphrase) throw new BadRequestException('No passphrase');

		await this.workspacesService.delete(passphrase, workspaceDto.password);

		// The workspace is gone, so this client's session goes with it
		res.clearCookie(APP_AUTH_COOKIE_NAME, DEFAULT_COOKIE_SETTINGS);
	}
}
