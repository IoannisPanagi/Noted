<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from '$lib/components/ui/card/index.js';
	import {
		InputGroup,
		InputGroupInput, InputGroupText,
	} from '$lib/components/ui/input-group/index.js';
	import { Kbd } from '$lib/components/ui/kbd/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { api } from '$lib/utils/api';
	import { CornerDownLeft } from '@lucide/svelte';
	import { goto } from '@roxi/routify';
    import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let isLoading = $state(false);

	let passphrase = $state(null);
	let password = $state(null);
	let fieldError = $state(null);

	let passphraseInput = $state(null);

	// Read during init: Routify's context is gone by the time .then runs
	const navigate = $goto;

	onMount(() => {
	    api.get('/authenticated').then((res) => {
			if (res.data.authenticated) navigate('/notes')
		});
	})

	function handleSubmit(event) {
		event.preventDefault();

		if (!passphrase) {
			fieldError = 'Passphrase is required';
		} else {
			fieldError = null;
			isLoading = true;

			api.post(
				'/login',
				JSON.stringify({
					passphrase,
					password,
				}),
			)
				.then(() => navigate('/notes'))
				.catch((error) => {
					// Every api rejection carries a readable `message`, see the interceptor in api.js
					toast.error(error.message);
				})
				.finally(() => {isLoading = false});
		}
	}

	function handleKeyDownWindow(e) {
		const el = document.activeElement;
		// element.isContentEditable is a field that asks if the given element is editable (for example text boxes or elements with the `contenteditable` property)
		if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el?.isContentEditable) return;

		const altGr = e.getModifierState('AltGraph');
		if ((e.ctrlKey || e.metaKey || e.altKey) && !altGr) return;

		if (e.key.length !== 1) return;

		// IME input (e.g. Japanese) builds words over several keys
		if (e.isComposing) return;

		 passphraseInput.focus();
	}

	function handleInputKeydown(e) {
		if (e.key === 'Escape') {
			e.currentTarget.blur()
		}
	}
</script>

<svelte:window onkeydown={handleKeyDownWindow} />

<div
	class="container mx-auto h-screen flex flex-col justify-center items-center"
>
	<header class="gate-header">
		<h1 class="gate-title">NOTED</h1>
		<p class="gate-tagline">Team organizing at its simplest</p>
	</header>
	<Card class="md:w-1/2 w-full">
		<CardHeader>
			<CardTitle>Workspace Gate</CardTitle>
			<CardDescription>
				Enter a passphrase to access a notes board
			</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} noValidate>
				<InputGroup class={fieldError !== null ? 'border-destructive' : ''}>
					<InputGroupInput
						id="passphrase"
						name="passphrase"
						type="text"
						placeholder="Enter your passphrase"
						bind:value={passphrase}
						bind:ref={passphraseInput}
						onkeydown={handleInputKeydown}
					/>
					{#if fieldError}
						<InputGroupText class="text-destructive pe-3">
							{fieldError}
						</InputGroupText>
					{/if}
					<!--				<InputGroup class="mt-4">-->
					<!--					<InputGroupInput-->
					<!--						name="password"-->
					<!--						type="password"-->
					<!--						placeholder="Enter your password"-->
					<!--					/>-->
					<!--					<InputGroupAddon align="inline-end">-->
					<!--						<InputGroupText class="italic">Optional</InputGroupText>-->
					<!--					</InputGroupAddon>-->
				</InputGroup>
				<div class="gate-actions">
					<span class="gate-hint">
						Press <Kbd><CornerDownLeft /> Enter</Kbd> to open the workspace
					</span>
					<Button type="submit" size="lg" disabled={isLoading}>
						{#if isLoading}
							<Spinner />
							Opening...
						{:else}
							Open board
						{/if}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>

<style>
@reference "../app.css";

.gate-header {
	@apply mb-6 text-center absolute 2xl:top-[20%] top-[15%];
}

.gate-title {
	@apply text-7xl font-black tracking-wide;

}

.gate-tagline {
	@apply mt-1 text-2xl text-muted-foreground;
	font-family: "Comic Neue", cursive;
}

.gate-actions {
	@apply mt-5 flex flex-wrap items-center gap-3;
}

.gate-hint {
	@apply flex items-center gap-1 ms-auto text-xs text-muted-foreground;
}
</style>
