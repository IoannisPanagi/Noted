<script>
import NotesPage from '$lib/components/notes-page.svelte';
import CategoriesProvider from '$lib/providers/categories-provider.svelte';
import NotesProvider from '$lib/providers/notes-provider.svelte';
import SocketProvider from '$lib/providers/socket-provider.svelte';
import WorkspaceProvider from '$lib/providers/workspace-provider.svelte';
</script>

<!-- Everything the page works on lives as long as the page does -->
<SocketProvider>
	<WorkspaceProvider>
		<CategoriesProvider>
			<NotesProvider>
				<NotesPage />
			</NotesProvider>
		</CategoriesProvider>
	</WorkspaceProvider>
</SocketProvider>
