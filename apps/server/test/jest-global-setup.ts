import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// One directory per run; each spec file gets its own database inside it
export default function globalSetup() {
	process.env.NOTED_E2E_DIRECTORY = mkdtempSync(join(tmpdir(), 'noted-e2e-'));
}
