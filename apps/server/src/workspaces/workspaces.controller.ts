import { APP_AUTH_COOKIE_NAME, DEFAULT_COOKIE_SETTINGS } from '@constants';
import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	NotFoundException,
	Res,
} from '@nestjs/common';
import {
	ApiCookieAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { Passphrase } from '@noted/decorators/passphrase.decorator';
import { Workspace } from '@noted/types';
import { DeleteWorkspaceDto } from '@noted/workspaces/dtos/deleteWorkspace.dto';
import { WorkspacesService } from '@noted/workspaces/workspaces.service';
import type { Response } from 'express';

@ApiTags('workspaces')
@ApiCookieAuth()
@Controller('workspaces')
export class WorkspacesController {
	constructor(private readonly workspacesService: WorkspacesService) {}

	@Get('/me')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Gets accessible workspace',
		description:
			'Gets the workspace that is accessible from the authentication cookie',
	})
	@ApiResponse({
		status: 200,
		description: 'The accessible workspace is returned',
	})
	public async findWorkspace(
		@Passphrase() passphrase: string,
	): Promise<Workspace> {
		const workspace = await this.workspacesService.findByPassphrase(passphrase);

		if (!workspace) throw new NotFoundException('Workspace does not exist');
		return { ...workspace, password: null };
	}

	// Deletes the workspace entry entirely - notes, categories and the row itself
	@Delete()
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({
		summary: 'Delete the workspace entirely',
		description:
			'Removes its notes, categories and the workspace row, and clears the auth cookie. A locked workspace must confirm its password.',
	})
	@ApiResponse({
		status: 401,
		description: 'Workspace is locked and the password did not match',
	})
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
