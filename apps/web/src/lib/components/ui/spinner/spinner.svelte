<script>
import Loader2Icon from '@lucide/svelte/icons/loader-2';
import { cn } from '$lib/utils.js';

let { class: className, ...restProps } = $props();
</script>

<Loader2Icon
	role="status"
	aria-label="Loading"
	class={cn('size-4 animate-spin', className)}
	{...restProps}
/>
