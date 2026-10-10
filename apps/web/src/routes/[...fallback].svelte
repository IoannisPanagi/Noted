<script>
	import toastImage from '$lib/assets/404_toast.png';
	import { Button } from '$lib/components/ui/button/index.js';
	import { DoorOpen } from '@lucide/svelte';
	import { goto } from '@roxi/routify';

	const navigate = $goto;

	function handleBack() {
		navigate('/', null, { mode: 'replace' });
	}
</script>

<div
	class="container mx-auto h-screen flex flex-col justify-center items-center"
>
	<img class="lost-image" src={toastImage} alt="A sad toast" />
	<p class="lost-message">Oh, the toast dropped its clipboard...</p>
	<p class="lost-detail">It couldn't find the page you were looking for.</p>
	<Button size="lg" onclick={handleBack}>
		Back to the gate
		<DoorOpen />
	</Button>
</div>

<style>
@reference "../app.css";

.lost-image {
	@apply size-48 md:size-56;
}

.lost-message {
	@apply mt-6 px-4 text-center text-2xl;
	font-family: "Comic Neue", cursive;
}

.lost-detail {
	@apply mt-1 mb-8 px-4 text-center text-muted-foreground;
}
</style>
