import { Category } from '@noted/types';

export type CategoryCreatedEvent = {
	category: Category;
	passphrase: string;
};
