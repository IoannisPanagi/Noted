import { APP_WORKSPACE_LOCAL_NAME, IS_PUBLIC_KEY } from '@constants';
import {
	createParamDecorator,
	ExecutionContext,
	InternalServerErrorException,
} from '@nestjs/common';
import { Workspace } from '@noted/types';

export const Passphrase = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): string => {
		const request = ctx.switchToHttp().getRequest();

		const workspace = request[APP_WORKSPACE_LOCAL_NAME] as Workspace;

		if (!workspace) throw new InternalServerErrorException('Workspace unknown');

		return workspace.passphrase;
	},
);
