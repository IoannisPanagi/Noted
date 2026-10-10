import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Workspace } from '@noted/types';
import { UpdateWorkspaceDto } from '@noted/workspaces/dtos/updateWorkspace.dto';
import { WorkspacesRepository } from '@noted/workspaces/workspaces.repository';
import bcrypt from 'bcrypt';

@Injectable()
export class WorkspacesService {
	private readonly logger = new Logger(WorkspacesService.name);

	constructor(
		private readonly workspaceRepository: WorkspacesRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async findByPassphrase(passphrase: string) {
		return this.workspaceRepository.findByPassphrase(passphrase);
	}

	async update(dto: UpdateWorkspaceDto, passphrase: string) {
		return this.save({
			passphrase,
			description: dto.description,
			password: dto.password,
		});
	}

	async save(workspace: Workspace): Promise<Workspace> {
		const [savedWorkspace] = await this.workspaceRepository.save({
			...workspace,
			password: await this.hashPassword(workspace),
		});

		await this.eventEmitter.emitAsync('workspace.updated', {
			workspace: { ...savedWorkspace, password: null },
			passphrase: savedWorkspace.passphrase,
		});

		return savedWorkspace;
	}

	// Re-hashing mints a new salt, changing the fingerprint and logging everyone out
	private async hashPassword({
		passphrase,
		password,
	}: Workspace): Promise<string | null> {
		if (!password) return null;

		const existing = await this.findByPassphrase(passphrase);
		if (
			existing?.password &&
			(await bcrypt.compare(password, existing.password))
		)
			return existing.password;

		return bcrypt.hash(password, 10);
	}

	// Workspaces are only persisted once something (a note or category) enters them
	async ensureExists(passphrase: string): Promise<void> {
		await this.workspaceRepository.ensureExists(passphrase);
		this.logger.verbose(`Workspace ${passphrase} exists`);
	}

	// A locked workspace needs its password; a never-persisted one is a no-op
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

		await this.eventEmitter.emitAsync('workspace.destroyed', { passphrase });
	}
}
