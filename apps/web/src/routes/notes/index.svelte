<script>
// TODO: load from the workspace endpoint
let workspace = $state({
	passphrase: "NOTED"
});
</script>

<div class="p-5">
	<h1 class="text-2xl font-semibold mb-5">{workspace?.passphrase}</h1>

	<hr class="border border-gray-500 mb-5" />
</div>
