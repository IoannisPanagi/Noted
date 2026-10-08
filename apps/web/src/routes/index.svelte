<script>
	// TODO Upgrade the passphrase gate to the new design
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
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { api } from '$lib/utils/api';
	import { goto } from '@roxi/routify';
    import { onMount } from 'svelte';

	let isLoading = $state(false);

	let passphrase = $state(null);
	let password = $state(null);
	let errorText = $state(null);

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
			errorText = 'Passphrase is required';
		} else {
			errorText = null;
			isLoading = true;

			api.post(
				'/login',
				JSON.stringify({
					passphrase,
					password,
				}),
			)
				.then(() => navigate('/notes'))
				.finally(() => {isLoading = false});
		}
	}

	function handleKeyDownWindow(e) {
		const el = document.activeElement;
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
	<Card class="md:w-1/2 w-full">
		<CardHeader>
			<CardTitle>Passphrase Gate</CardTitle>
			<CardDescription
				>Enter a passphrase to access a notes board</CardDescription
			>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} noValidate>
				<InputGroup class={errorText !== null ? 'border-red-500' : ''}>
				<InputGroupInput
						id="passphrase"
						name="passphrase"
						type="text"
						placeholder="Enter your passphrase"
						bind:value={passphrase}
						bind:ref={passphraseInput}
						onkeydown={handleInputKeydown}
					/>
					{#if errorText}
						<InputGroupText class="text-red-500 pe-3">
							{errorText}
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
				<Button type="submit" class="mt-5" size="lg" disabled={isLoading}>
					{#if isLoading}
						<Spinner />
						Processing...
					{:else}
						Submit
					{/if}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
