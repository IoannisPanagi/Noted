<script>
import { CornerDownLeft } from '@lucide/svelte';
import { Button } from '$lib/components/ui/button/index.js';
import { Kbd, KbdGroup } from '$lib/components/ui/kbd/index.js';

// Shown next to anything edited in place, where only Enter saves, and in dialog
// footers, where Enter runs the dialog's action. Each hint is also a button that
// does what its key does
let { class: className, action = 'save', onsave, oncancel } = $props();

// Pressing a button would normally take focus from the field being edited, and
// leaving that field throws the edit away before the click could save it
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

<!-- Everything here is a shadcn component, so the classes are global -->
<style>
@reference "../../app.css";

/* "↵ Enter to save · Esc to cancel". Only the layout lives here; the keys are
   shadcn's Kbd */
:global(.save-hint) {
	@apply flex h-6 shrink-0 items-center gap-1 text-xs;
}

/* Small enough to keep the hint's 24px height */
:global(.save-hint-action) {
	@apply h-6 gap-1 px-1.5 text-xs font-normal;
}
</style>
