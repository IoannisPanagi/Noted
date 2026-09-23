export async function load({ locals }) {
	return {
		workspace: {
			...locals.workspace,
			password: undefined,
		},
	};
}
