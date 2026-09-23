<script>
import { Moon, Sun } from '@lucide/svelte';
import { ModeWatcher, toggleMode } from 'mode-watcher';
import icon from '$lib/assets/icon.svg';
import { Button } from '$lib/components/ui/button/index.js';
import { Toaster } from '$lib/components/ui/sonner/index.js';
import Login from './pages/login.svelte';

// TODO: the notes pages still import SvelteKit-only modules, so they stay out
//  of here until they are ported
let currentPage = $state('login');
</script>

<svelte:head>
	<link rel="icon" href={icon} />
	<title>Noted</title>

	<meta name="author" content="Ioannis Panagi" />
	<meta name="description"
				content="Sinmis' first real web app that went into production; Here to serve all your post-it note needs via passphrase workspace implementation" />
</svelte:head>

<div class="flex flex-row items-center gap-3 absolute top-5 right-5">
	<Button onclick={toggleMode} variant="outline" size="icon">
		<Sun size={24} class="dark:hidden block" />
		<Moon size={24} class="dark:block hidden" />
	</Button>

	<img class="size-12 md:block hidden" src={icon} alt="Icon" />
</div>

<ModeWatcher />
<Toaster position="top-center" />

{#if currentPage === 'login'}
	<Login />
{/if}
