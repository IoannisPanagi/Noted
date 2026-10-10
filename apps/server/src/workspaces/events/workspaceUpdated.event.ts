import { Workspace } from '@noted/types';

export type WorkspaceUpdatedEvent = {
	workspace: Workspace;
	passphrase: string;
};
