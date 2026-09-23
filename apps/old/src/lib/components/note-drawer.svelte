<script>
import NotesMasonry from '$lib/components/note-masonry.svelte';
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '$lib/components/ui/drawer/index.js';
import { buttonVariants } from './ui/button';
</script>

<Drawer>
	<DrawerTrigger class={buttonVariants({ variant: 'outline' })}>Archived</DrawerTrigger>

	<DrawerContent>
		<DrawerHeader>
			<DrawerTitle>Archived notes</DrawerTitle>
			<DrawerDescription>View your archived notes.</DrawerDescription>
		</DrawerHeader>
		<NotesMasonry noteStatus={{completed: true}} />
	</DrawerContent>
</Drawer>
