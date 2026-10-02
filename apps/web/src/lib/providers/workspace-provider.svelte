<script module>
import { createContext } from 'svelte';

// Anything under a WorkspaceProvider reaches the workspace with getWorkspace()
export const [getWorkspace, setWorkspace] = createContext();
</script>

<script>
import { goto } from '@roxi/routify';
import { onDestroy } from 'svelte';
import { getSocket } from './socket-provider.svelte';
import { Workspace } from './workspace.svelte.js';

let { children } = $props();

// Read during init: Routify's context is gone by the time a handler runs
const navigate = $goto;

const workspace = setWorkspace(new Workspace(getSocket().client));
onDestroy(() => workspace.destroy());

// Without a session for it, it's back to the start. Showing the loading and
// errors is up to whoever renders under here
workspace.load().then(() => {
	if ([401, 403].includes(workspace.error?.statusCode)) navigate('/');
});
</script>

{@render children()}
