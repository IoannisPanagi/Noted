<script module>
import { createContext } from 'svelte';

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

// No session for this workspace sends the user back to the start
workspace.load().then(() => {
	if ([401, 403].includes(workspace.error?.statusCode)) navigate('/');
});
</script>

{@render children()}
