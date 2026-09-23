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
	InputGroupInput,
} from '$lib/components/ui/input-group/index.js';
import { Spinner } from '$lib/components/ui/spinner/index.js';

let isLoading = $state(false);

// TODO: submit the passphrase to apps/server and navigate to the notes page
function handleSubmit(event) {
	event.preventDefault();
}
</script>

<div class="container mx-auto h-screen flex flex-col justify-center items-center">
	<Card class="md:w-1/2 w-full">
		<CardHeader>
			<CardTitle>Passphrase Gate</CardTitle>
			<CardDescription>Enter a passphrase to access a notes board</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} noValidate>
				<InputGroup>
					<InputGroupInput
						name="passphrase"
						type="text"
						placeholder="Enter your passphrase"
					/>
<!--				</InputGroup>-->
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

