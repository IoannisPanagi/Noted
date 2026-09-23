CREATE TABLE IF NOT EXISTS `categories` (
	`id` text PRIMARY KEY,
	`label` text NOT NULL,
	`description` text,
	`passphrase` text NOT NULL,
	CONSTRAINT `fk_categories_passphrase_workspaces_passphrase_fk` FOREIGN KEY (`passphrase`) REFERENCES `workspaces`(`passphrase`),
	CONSTRAINT `categories_unique_per_workspace` UNIQUE(`label`,`passphrase`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `notes` (
	`id` text PRIMARY KEY,
	`passphrase` text NOT NULL,
	`text` text NOT NULL,
	`backgroundColor` text NOT NULL,
	`isCompleted` integer DEFAULT 0 NOT NULL,
	`createdAt` text NOT NULL,
	`completedAt` text,
	`note_order` integer NOT NULL,
	`category_id` text DEFAULT NULL,
	CONSTRAINT `fk_notes_passphrase_workspaces_passphrase_fk` FOREIGN KEY (`passphrase`) REFERENCES `workspaces`(`passphrase`),
	CONSTRAINT `fk_notes_category_id_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`),
	CONSTRAINT `notes_unique_per_workspace` UNIQUE(`passphrase`,`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workspaces` (
	`passphrase` text PRIMARY KEY,
	`description` text,
	`password` text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_categories` ON `categories` (`passphrase`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_passphrase` ON `notes` (`passphrase`);