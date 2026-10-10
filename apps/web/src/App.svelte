<script>
import { Moon, Sun, RectangleEllipsis, RectangleHorizontal } from '@lucide/svelte';
import { ModeWatcher, toggleMode } from 'mode-watcher';
import icon from '$lib/assets/icon.svg';
import { Button } from '$lib/components/ui/button/index.js';
import { Toaster } from '$lib/components/ui/sonner/index.js';
import {createRouter, Router} from '@roxi/routify';
import routes from '../.routify/routes.default.js';
import { noteButtons, toggleNoteButtons } from '$lib/utils/noteButtons.svelte.js';

const router = createRouter({ routes });
const { activeRoute } = router;

let currentPage = $derived($activeRoute?.url);
</script>

<svelte:head>
	<link rel="icon" href={icon} />
	<title>Noted</title>

	<meta name="author" content="Ioannis Panagi" />
	<meta name="description"
				content="Sinmis' first real web app that went into production; Here to serve all your post-it note needs via passphrase workspace implementation" />
</svelte:head>

<div class="flex flex-row items-center gap-3 absolute top-5 right-5">
	{#if currentPage?.startsWith('/notes')}
		<Button onclick={toggleNoteButtons} variant={noteButtons.active ? 'default' : 'outline'} title="Show or hide note buttons" size="icon">
			<RectangleHorizontal size={24} class={noteButtons.active ? 'hidden' : 'block'} />
			<RectangleEllipsis size={24} class={noteButtons.active ? 'block' : 'hidden'} />
		</Button>
	{/if}
	<Button onclick={toggleMode} variant="outline" size="icon">
		<Sun size={24} class="dark:hidden block" />
		<Moon size={24} class="dark:block hidden" />
	</Button>

	<img class="size-12 md:block hidden" src={icon} alt="Icon" />
</div>

<ModeWatcher />
<Toaster position="top-center" />

<Router {router} />
