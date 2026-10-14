CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`status_token_hash` text NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`payload` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`session_id` text NOT NULL,
	`provider_order_id` text,
	`provider_token` text,
	`created_at` integer NOT NULL,
	`paid_at` integer,
	FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_quote_unique` ON `bookings` (`quote_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_token_unique` ON `bookings` (`status_token_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_session_unique` ON `bookings` (`session_id`);--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`audience` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`provider_id` text,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `email_outbox_pending` ON `email_outbox` (`status`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`mode` text NOT NULL,
	`payload` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'PLN' NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
