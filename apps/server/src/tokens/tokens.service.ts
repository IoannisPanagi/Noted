import { createHmac, timingSafeEqual } from 'node:crypto';
import { PASSWORD_FINGERPRINT_KEY } from '@constants';
import {
	BadRequestException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PayloadDTO, PayloadSchema } from '@noted/tokens/dtos/payload.dto';
import { Workspace } from '@noted/types';
import { WorkspacesService } from '@noted/workspaces/workspaces.service';

@Injectable()
export class TokensService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly workspacesService: WorkspacesService,
	) {}

	async generateToken(
		passphrase: string,
		password: string | null,
	): Promise<string> {
		const payload: PayloadDTO = {
			passphrase,
			passwordFingerprint: this.passwordFingerprint(passphrase, password),
		};

		return await this.jwtService.signAsync(payload);
	}

	async validateToken(token: string): Promise<Workspace> {
		if (!token) throw new BadRequestException('Token is missing');

		let payload: PayloadDTO;
		try {
			payload = PayloadSchema.parse(
				await this.jwtService.verifyAsync<PayloadDTO>(token),
			);
		} catch {
			throw new UnauthorizedException('Invalid token');
		}

		const workspace = await this.workspacesService.findByPassphrase(
			payload.passphrase,
		);

		// Not persisted yet, so it's open
		const currentWorkspace: Workspace = workspace ?? {
			passphrase: payload.passphrase,
			description: null,
			password: null,
		};

		// A changed, added or removed password invalidates every older token
		if (
			!this.fingerprintMatches(
				payload.passwordFingerprint,
				this.passwordFingerprint(
					currentWorkspace.passphrase,
					currentWorkspace.password,
				),
			)
		)
			throw new UnauthorizedException('Invalid token');

		return currentWorkspace;
	}

	// Open workspaces fingerprint an empty password. HMAC keeps the hash untestable without the key
	private passwordFingerprint(passphrase: string, password: string | null) {
		return createHmac('sha256', PASSWORD_FINGERPRINT_KEY)
			.update(`${passphrase}:${password ?? ''}`)
			.digest('base64url');
	}

	private fingerprintMatches(candidate: string, expected: string) {
		const candidateBuffer = Buffer.from(candidate);
		const expectedBuffer = Buffer.from(expected);

		return (
			candidateBuffer.length === expectedBuffer.length &&
			timingSafeEqual(candidateBuffer, expectedBuffer)
		);
	}
}
