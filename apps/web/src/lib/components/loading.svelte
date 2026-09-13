<script>
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
} from '$lib/components/ui/empty/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';

let { description } = $props();
</script>

<div class="container mx-auto flex flex-col justify-center items-center">
	<Empty>
		<EmptyHeader>
			<EmptyMedia class="rounded-full" variant="icon">
				<Spinner class="text-blue-500" />
			</EmptyMedia>
			<EmptyDescription>{description}</EmptyDescription>
		</EmptyHeader>
	</Empty>
</div>
