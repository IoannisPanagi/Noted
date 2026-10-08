import { APP_AUTH_COOKIE_NAME, DEFAULT_COOKIE_SETTINGS } from '@constants';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Put,
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
import { UpdateWorkspaceDto } from '@noted/workspaces/dtos/updateWorkspace.dto';
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
	// Workspace always "exists" regardless if it has notes or not
	public async findWorkspace(
		@Passphrase() passphrase: string,
	): Promise<Workspace> {
		const workspace = await this.workspacesService.findByPassphrase(passphrase);

		if (!workspace) return { passphrase, description: null, password: null };
		return { ...workspace, password: null };
	}

	@Put()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: 'Update the workspace',
		description:
			'Replaces both the description and the password; an omitted password unlocks the workspace. Changing the password logs every session out.',
	})
	public async updateWorkspace(
		@Body() workspaceDto: UpdateWorkspaceDto,
		@Passphrase() passphrase: string,
	): Promise<Workspace> {
		const workspace = await this.workspacesService.save({
			...workspaceDto,
			passphrase,
		});
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
		await this.workspacesService.delete(passphrase, workspaceDto.password);

		// The workspace is gone, so this client's session goes with it
		res.clearCookie(APP_AUTH_COOKIE_NAME, DEFAULT_COOKIE_SETTINGS);
	}
}
