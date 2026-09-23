import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Workspace } from '@noted/types';
import { WorkspacesRepository } from '@noted/workspaces/workspaces.repository';
import bcrypt from 'bcrypt';

@Injectable()
export class WorkspacesService {
	private readonly logger = new Logger(WorkspacesService.name);

	constructor(private readonly workspaceRepository: WorkspacesRepository) {}

	async findByPassphrase(passphrase: string) {
		return this.workspaceRepository.findByPassphrase(passphrase);
	}

	async save(workspace: Workspace): Promise<Workspace> {
		const [savedWorkspace] = await this.workspaceRepository.save(workspace);
		return savedWorkspace;
	}

	// Workspaces are only persisted once something (a note or category) enters them
	async ensureExists(passphrase: string): Promise<void> {
		await this.workspaceRepository.ensureExists(passphrase);
		this.logger.verbose(`Workspace ${passphrase} exists`);
	}

	// Deletes the workspace with everything in it. A locked workspace must have
	// its password confirmed; a workspace that was never persisted is a no-op.
	async delete(passphrase: string, password: string | null): Promise<void> {
		const workspace =
			await this.workspaceRepository.findByPassphrase(passphrase);
		if (!workspace) return;

		if (
			workspace.password !== null &&
			!(password && (await bcrypt.compare(password, workspace.password)))
		)
			throw new UnauthorizedException('Invalid credentials');

		await this.workspaceRepository.deleteWithContents(passphrase);
		this.logger.log(`Deleted workspace ${passphrase} and its contents`);
	}
}
