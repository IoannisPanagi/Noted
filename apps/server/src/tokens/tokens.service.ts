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

	// The password hash is the workspace's stored hash, or null while it's open
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

		// Not persisted yet (nothing has entered it), so it's an open workspace
		const currentWorkspace: Workspace = workspace ?? {
			passphrase: payload.passphrase,
			description: null,
			password: null,
		};

		// The workspace's lock state must be the one the token was issued against:
		// a changed, added or removed password invalidates every older token
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

	// An open workspace fingerprints an empty password, so every token has one.
	// The hash itself never leaves the server - HMAC makes the tag opaque to
	// anyone without the key, so it can't be tested against candidate hashes.
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
