<script>
	import sadToastImage from '$lib/assets/404_toast.png';
	import toastImage from '$lib/assets/icon.svg';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { api } from '$lib/utils/api';
	import { DoorOpen, RotateCw } from '@lucide/svelte';
	import { goto } from '@roxi/routify';
	import { AxiosError } from 'axios';
	import { onMount } from 'svelte';

	const STATUSES = {
		checking: {
			title: 'Checking the server...',
			description: 'The toast is looking for its clipboard.',
		},
		healthy: {
			title: 'All systems ready',
			description: 'The toast has its clipboard, you are good to go.',
		},
		down: {
			title: 'Server unreachable',
			description: "The server isn't answering at all, it may be down.",
		},
		unresponsive: {
			title: 'Server not responding',
			description: 'The server is up but took too long to answer.',
		},
		database: {
			title: 'Database unavailable',
			description: "The server is up but can't reach its notes right now.",
		},
		unknown: {
			title: 'Something went wrong',
			description: 'The server answered with an unexpected error.',
		},
	};

	// Long enough for the bar to visibly fill on a fast server
	const MIN_CHECK_MS = 800;

	let status = $state('checking');
	let progress = $state(0);

	let current = $derived(STATUSES[status]);
	let isUnhealthy = $derived(status !== 'checking' && status !== 'healthy');

	const navigate = $goto;

	function statusFromError(error) {
		if (error.code === AxiosError.ERR_NETWORK) return 'down';
		if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT)
			return 'unresponsive';
		if (error.statusCode === 503) return 'database';
		return 'unknown';
	}

	async function handleCheck() {
		status = 'checking';
		progress = 0;
		// Next frame, so the bar animates from empty instead of jumping
		requestAnimationFrame(() => {
			progress = 90;
		});

		const [result] = await Promise.allSettled([
			api.get('/health'),
			new Promise((resolve) => setTimeout(resolve, MIN_CHECK_MS)),
		]);

		status = result.status === 'fulfilled' ? 'healthy' : statusFromError(result.reason);
		progress = 100;
	}

	function handleBack() {
		navigate('/', null, { mode: 'replace' });
	}

	onMount(handleCheck);
</script>

<div
	class="container mx-auto h-screen flex flex-col md:flex-row justify-center items-center gap-10 md:gap-24 px-4"
>
	<img
		class="network-image"
		src={isUnhealthy ? sadToastImage : toastImage}
		alt={isUnhealthy ? 'A sad toast' : 'A toast holding a clipboard'}
	/>
	<div class="network-panel">
		<h1 class="network-title">{current.title}</h1>
		<p class="network-description">{current.description}</p>
		<Progress
			value={progress}
			class={['network-bar', status === 'checking' && 'is-checking', isUnhealthy && 'is-unhealthy']}
		/>
		<div class="network-actions">
			<Button variant="outline" size="lg" disabled={status === 'checking'} onclick={handleCheck}>
				{#if status === 'checking'}
					<Spinner data-icon="inline-start" />
				{:else}
					<RotateCw data-icon="inline-start" />
				{/if}
				Check again
			</Button>
			{#if status === 'healthy'}
				<Button size="lg" onclick={handleBack}>
					Back to the gate
					<DoorOpen data-icon="inline-end" />
				</Button>
			{/if}
		</div>
	</div>
</div>

<style>
@reference "../../app.css";

.network-image {
	@apply size-40 md:size-70;
}

.network-panel {
	@apply flex w-full max-w-md flex-col gap-3 text-center md:text-start;
}

.network-title {
	@apply text-4xl font-black tracking-wide;
}

.network-description {
	@apply text-xl text-muted-foreground;
	font-family: "Comic Neue", cursive;
}

.network-panel :global(.network-bar) {
	@apply mt-3 h-2;
}

.network-panel :global(.network-bar [data-slot='progress-indicator']) {
	@apply bg-green-600;
}

/* Slow while checking so the bar creeps forward, quick to finish once the answer is in */
.network-panel :global(.network-bar.is-checking [data-slot='progress-indicator']) {
	@apply duration-[2000ms] ease-out;
}

.network-panel :global(.network-bar.is-unhealthy [data-slot='progress-indicator']) {
	@apply bg-destructive;
}

.network-actions {
	@apply mt-5 flex flex-wrap justify-center gap-3 md:justify-start;
}
</style>
