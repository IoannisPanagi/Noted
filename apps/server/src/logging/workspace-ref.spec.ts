import { workspaceRef } from '@noted/logging/workspace-ref';

describe('workspaceRef', () => {
	it('is stable for the same passphrase', () => {
		expect(workspaceRef('my-passphrase')).toBe(workspaceRef('my-passphrase'));
	});

	it('differs between passphrases', () => {
		expect(workspaceRef('one')).not.toBe(workspaceRef('two'));
	});

	it('never contains the passphrase itself', () => {
		const passphrase = 'sensitive-passphrase';

		expect(workspaceRef(passphrase)).not.toContain(passphrase);
		expect(workspaceRef(passphrase)).toHaveLength(10);
	});
});
