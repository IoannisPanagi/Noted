import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginReqDto } from '@noted/auth/dtos/loginReq.dto';
import { workspaceRef } from '@noted/logging/workspace-ref';
import { TokenResDto } from '@noted/notes/dtos/tokenRes.dto';
import { TokensService } from '@noted/tokens/tokens.service';
import { WorkspacesService } from '@noted/workspaces/workspaces.service';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
	private readonly logger = new Logger(AuthService.name);

	constructor(
		private readonly workspacesService: WorkspacesService,
		private readonly tokensService: TokensService,
	) {}

	async login(req: LoginReqDto): Promise<TokenResDto> {
		const workspace = await this.workspacesService.findByPassphrase(
			req.passphrase,
		);

		// Supplying a password for a workspace that doesn't exist yet creates it
		// locked down with that password
		if (!workspace && req.password) {
			const savedWorkspace = await this.workspacesService.save({
				passphrase: req.passphrase,
				description: null,
				password: await bcrypt.hash(req.password, 10),
			});

			this.logger.log(
				`Created locked workspace ${workspaceRef(req.passphrase)}`,
			);

			return {
				token: await this.tokensService.generateToken(
					savedWorkspace.passphrase,
					savedWorkspace.password,
				),
			};
		}

		// Without a password, logging in never creates a workspace - it's persisted
		// once a note or category enters it. Until then, and while it has no
		// password, it's open.
		if (!workspace || workspace.password === null) {
			this.logger.debug(
				`Logged in to open workspace ${workspaceRef(req.passphrase)}`,
			);

			return {
				token: await this.tokensService.generateToken(req.passphrase, null),
			};
		}

		if (
			req.password &&
			(await bcrypt.compare(req.password, workspace.password))
		) {
			this.logger.debug(
				`Logged in to locked workspace ${workspaceRef(req.passphrase)}`,
			);

			return {
				token: await this.tokensService.generateToken(
					workspace.passphrase,
					workspace.password,
				),
			};
		}

		this.logger.warn(
			`Rejected login for locked workspace ${workspaceRef(req.passphrase)}`,
		);

		throw new UnauthorizedException('Invalid credentials');
	}
}
