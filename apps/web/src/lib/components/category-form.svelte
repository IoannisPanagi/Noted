<script>
import { toast } from 'svelte-sonner';
import { Button } from '$lib/components/ui/button/index.js';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
} from '$lib/components/ui/input-group/index.js';
import { Label } from '$lib/components/ui/label/index.js';
import { categories } from '$lib/stores/categories.js';

let label = $state(null);
let description = $state(category?.description);

let {
	open = $bindable(true),
	currentCategoryId = $bindable({}),
	category,
} = $props();

async function handleSubmit() {
	try {
		let cat = null;
		if (category) {
			cat = await categories.editCategory({
				...category,
				description: description,
			});

			toast.success(`${category.label} updated!`);
		} else {
			cat = await categories.addCategory({
				label: label,
				description: description,
			});

			toast.success('Category added!');
		}

		currentCategoryId = cat.id;
	} catch (err) {
		toast.error(err.message);
	} finally {
		open = false;
	}
}

function handleCancel() {
	open = false;
}

function handleEnter(e) {
	if (
		e.key === 'Enter' &&
		!e.shiftKey &&
		!e.ctrlKey &&
		!e.altKey &&
		!e.metaKey
	) {
		e.preventDefault();

		handleSubmit();
	}
}
</script>

<form class="flex flex-col gap-3">
	{#if !category}
		<InputGroup>
			<InputGroupAddon>
				<Label>Label:</Label>
			</InputGroupAddon>
			<InputGroupInput
				onkeydown={handleEnter}
				bind:value={label}
				placeholder="Homework"
			/>
		</InputGroup>
	{/if}
	<InputGroup>
		<InputGroupAddon align="block-start">
			<Label>Description:</Label>
		</InputGroupAddon>
		<InputGroupTextarea
			onkeydown={handleEnter}
			bind:value={description}
			placeholder="The homework I have left to do..." />
		<InputGroupAddon class="ms-auto" align="end">
			<InputGroupText class="italic me-3">Optional</InputGroupText>
		</InputGroupAddon>
	</InputGroup>
	<span class="ms-auto mt-3">
		<Button variant="destructive" onclick={handleCancel} size="sm" type="cancel">Cancel</Button>
		<Button onclick={handleSubmit} size="sm" type="submit">Submit</Button>
	</span>
</form>