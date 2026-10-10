import { APP_WORKSPACE_LOCAL_NAME } from '@constants';
import {
	createParamDecorator,
	ExecutionContext,
	InternalServerErrorException,
} from '@nestjs/common';
import { Workspace } from '@noted/types';
import { Socket } from 'socket.io';

export const Passphrase = createParamDecorator(
	(data: unknown, ctx: ExecutionContext): string => {
		const client = ctx.switchToWs().getClient<Socket>();

		const workspace = client.data[APP_WORKSPACE_LOCAL_NAME] as Workspace;

		if (!workspace) throw new InternalServerErrorException('Workspace unknown');

		return workspace.passphrase;
	},
);
