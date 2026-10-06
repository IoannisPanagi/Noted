import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { LoginReqDto } from '@noted/auth/dtos/loginReq.dto';
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

		// A password for a nonexistent workspace creates it locked
		if (!workspace && req.password) {
			const savedWorkspace = await this.workspacesService.save({
				passphrase: req.passphrase,
				description: null,
				password: req.password,
			});

			this.logger.log(`Created locked workspace ${req.passphrase}`);

			return {
				token: await this.tokensService.generateToken(
					savedWorkspace.passphrase,
					savedWorkspace.password,
				),
			};
		}

		// Without a password nothing is created; it's persisted once a note or category enters it
		if (!workspace || workspace.password === null) {
			this.logger.debug(`Logged in to open workspace ${req.passphrase}`);

			return {
				token: await this.tokensService.generateToken(req.passphrase, null),
			};
		}

		if (
			req.password &&
			(await bcrypt.compare(req.password, workspace.password))
		) {
			this.logger.debug(`Logged in to locked workspace ${req.passphrase}`);

			return {
				token: await this.tokensService.generateToken(
					workspace.passphrase,
					workspace.password,
				),
			};
		}

		this.logger.warn(`Rejected login for locked workspace ${req.passphrase}`);

		throw new UnauthorizedException('Invalid credentials');
	}
}
