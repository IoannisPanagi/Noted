import { createHmac } from 'node:crypto';
import { LOG_REFERENCE_KEY } from '@constants';

// A passphrase is a credential, so it never reaches the logs. This is a short,
// stable stand-in that makes entries for one workspace correlatable without
// putting the key to it in a log file.
export function workspaceRef(passphrase: string): string {
	return createHmac('sha256', LOG_REFERENCE_KEY)
		.update(passphrase)
		.digest('base64url')
		.slice(0, 10);
}
