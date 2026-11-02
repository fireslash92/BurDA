CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`ambassador_id` text NOT NULL,
	`indicator_id` text NOT NULL,
	`period_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`date` text NOT NULL,
	`beneficiaries` integer DEFAULT 0 NOT NULL,
	`evidence_url` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`reviewer` text DEFAULT '' NOT NULL,
	`review_comment` text DEFAULT '' NOT NULL,
	`reviewed_at` text,
	FOREIGN KEY (`ambassador_id`) REFERENCES `ambassadors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`indicator_id`) REFERENCES `indicators`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `achievements_period_status` ON `achievements` (`period_id`,`status`);--> statement-breakpoint
CREATE INDEX `achievements_ambassador` ON `achievements` (`ambassador_id`);--> statement-breakpoint
CREATE TABLE `ambassadors` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization` text NOT NULL,
	`wilaya` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`achievement_id` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `indicators` (
	`id` text PRIMARY KEY NOT NULL,
	`period_id` text NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`unit` text NOT NULL,
	`weight` real NOT NULL,
	`default_target` real NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `members` (
	`email` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`ambassador_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`ambassador_id`) REFERENCES `ambassadors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `member_uid` ON `members` (`user_id`);--> statement-breakpoint
CREATE TABLE `periods` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`starts_on` text NOT NULL,
	`ends_on` text NOT NULL,
	`locked` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `targets` (
	`ambassador_id` text NOT NULL,
	`indicator_id` text NOT NULL,
	`value` real NOT NULL,
	PRIMARY KEY(`ambassador_id`, `indicator_id`),
	FOREIGN KEY (`ambassador_id`) REFERENCES `ambassadors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`indicator_id`) REFERENCES `indicators`(`id`) ON UPDATE no action ON DELETE no action
);
