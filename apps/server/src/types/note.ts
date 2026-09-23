export type Note = {
	id: string;
	passphrase: string;
	text: string;
	backgroundColor: string;
	isCompleted: boolean;
	createdAt: string;
	completedAt: string | null;
	noteOrder: number;
	categoryId: string | null;
};
