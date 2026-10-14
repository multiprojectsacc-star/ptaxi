CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"quote_id" text NOT NULL,
	"status_token_hash" text NOT NULL,
	"mode" text NOT NULL,
	"status" text NOT NULL,
	"payload" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"session_id" text NOT NULL,
	"provider_order_id" text,
	"provider_token" text,
	"created_at" bigint NOT NULL,
	"paid_at" bigint
);
--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"audience" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" bigint,
	"provider_id" text,
	"created_at" bigint NOT NULL,
	"sent_at" bigint
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" text NOT NULL,
	"expires_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" text PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"payload" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'PLN' NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"expires_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_quote_unique" ON "bookings" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_token_unique" ON "bookings" USING btree ("status_token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_session_unique" ON "bookings" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "email_outbox_pending" ON "email_outbox" USING btree ("status");