<script>
import { Textarea } from '$lib/components/ui/textarea/index.js';
import { cn } from '$lib/utils.js';

let {
	ref = $bindable(null),
	value = $bindable(),
	class: className,
	autosize = false,
	...props
} = $props();

function autosizeInputBox(e) {
	if (autosize) {
		const textBox = e.target.parentElement;
		textBox.style.height = 'auto';
		textBox.style.height =
			textBox.offsetHeight - 80 + e.target.scrollHeight + 'px';
	}
}
</script>

<Textarea
	oninput={(e) => {autosizeInputBox(e)}}
	bind:ref
	data-slot="input-group-control"
	class={cn(
		'flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent',
		autosize ? 'bg-background' : '',
		className
	)}
	bind:value
	{...props}
/>
