<script>
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '$lib/components/ui/dialog/index.js';

let {
	open = $bindable(false),
	title,
	description,
	noCancel = false,
	children,
} = $props();
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{title}</DialogTitle>
			<DialogDescription>{description}</DialogDescription>
		</DialogHeader>
		{@render children()}
		{#if noCancel}
			<DialogFooter>
				<DialogClose>Cancel</DialogClose>
			</DialogFooter>
		{/if}
	</DialogContent>
</Dialog>