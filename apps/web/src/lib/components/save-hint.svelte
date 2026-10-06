<script>
import { CornerDownLeft } from '@lucide/svelte';
import { Button } from '$lib/components/ui/button/index.js';
import { Kbd, KbdGroup } from '$lib/components/ui/kbd/index.js';

let { class: className, action = 'save', onsave, oncancel } = $props();

// Taking focus would blur the field and throw the edit away before the click saves it
const keepFocus = (e) => e.preventDefault();
</script>

<KbdGroup class={['save-hint', className]}>
	<Button variant="ghost" size="sm" class="save-hint-action" onmousedown={keepFocus} onclick={onsave}>
		<Kbd><CornerDownLeft /> Enter</Kbd> to {action}
	</Button>
	<Button variant="ghost" size="sm" class="save-hint-action" onmousedown={keepFocus} onclick={oncancel}>
		<Kbd>Esc</Kbd> to cancel
	</Button>
</KbdGroup>

<style>
@reference "../../app.css";

:global(.save-hint) {
	@apply flex h-6 shrink-0 items-center gap-1 text-xs;
}

:global(.save-hint-action) {
	@apply h-6 gap-1 px-1.5 text-xs font-normal;
}
</style>
