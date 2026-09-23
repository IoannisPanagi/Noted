import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// One directory for the whole run; jest-setup-e2e gives each spec file its own
// database inside it, and jest-global-teardown removes the lot
export default function globalSetup() {
	process.env.NOTED_E2E_DIRECTORY = mkdtempSync(join(tmpdir(), 'noted-e2e-'));
}
