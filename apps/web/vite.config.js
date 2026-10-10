import { fileURLToPath } from 'node:url';
import routify from '@roxi/routify/vite-plugin';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Empty prefix: API_PROXY_TARGET is for this file only, not for the bundle
	const env = loadEnv(mode, process.cwd(), '');
	const apiTarget = env.API_PROXY_TARGET ?? 'http://localhost:3000';

	return {
		plugins: [tailwindcss(), routify(), svelte()],
		resolve: {
			alias: {
				$lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
			},
		},
		// Does in dev what nginx does in the web image
		server: {
			proxy: {
				'/api': apiTarget,
				'/socket.io': { target: apiTarget, ws: true },
			},
		},
	};
});
