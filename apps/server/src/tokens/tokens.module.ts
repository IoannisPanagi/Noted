import { JWT_CONSTANTS } from '@constants';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TokensService } from '@noted/tokens/tokens.service';
import { WorkspacesModule } from '@noted/workspaces/workspaces.module';

@Module({
	imports: [
		JwtModule.register({
			secret: JWT_CONSTANTS.SECRET,
			signOptions: {
				expiresIn: JWT_CONSTANTS.EXPIRY_SECONDS,
				algorithm: 'HS256',
			},
			// Pinned, so a token can't pick its own algorithm
			verifyOptions: {
				algorithms: ['HS256'],
			},
		}),
		WorkspacesModule,
	],
	providers: [TokensService],
	exports: [TokensService],
})
export class TokensModule {}
