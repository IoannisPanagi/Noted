import { Category } from '@noted/types';

export type CategoryUpdatedEvent = {
	category: Category;
	passphrase: string;
};
