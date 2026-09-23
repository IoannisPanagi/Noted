import { rmSync } from 'node:fs';

export default function globalTeardown() {
	if (process.env.NOTED_E2E_DIRECTORY)
		rmSync(process.env.NOTED_E2E_DIRECTORY, { recursive: true, force: true });
}
