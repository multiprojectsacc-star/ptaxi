import { bigint, integer, pgTable, text, uniqueIndex, index } from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  expiresAt: bigint("expires_at", {mode: "number"}).notNull(),
});

export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(),
  mode: text("mode").notNull(),
  payload: text("payload").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("PLN"),
  expiresAt: bigint("expires_at", {mode: "number"}).notNull(),
  createdAt: bigint("created_at", {mode: "number"}).notNull(),
});

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  quoteId: text("quote_id").notNull().references(() => quotes.id),
  statusTokenHash: text("status_token_hash").notNull(),
  mode: text("mode").notNull(),
  status: text("status").notNull(),
  payload: text("payload").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  sessionId: text("session_id").notNull(),
  providerOrderId: text("provider_order_id"),
  providerToken: text("provider_token"),
  createdAt: bigint("created_at", {mode: "number"}).notNull(),
  paidAt: bigint("paid_at", {mode: "number"}),
}, (table) => [
  uniqueIndex("bookings_quote_unique").on(table.quoteId),
  uniqueIndex("bookings_token_unique").on(table.statusTokenHash),
  uniqueIndex("bookings_session_unique").on(table.sessionId),
]);

export const emailOutbox = pgTable("email_outbox", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  audience: text("audience").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lockedUntil: bigint("locked_until", {mode: "number"}),
  providerId: text("provider_id"),
  createdAt: bigint("created_at", {mode: "number"}).notNull(),
  sentAt: bigint("sent_at", {mode: "number"}),
}, (table) => [index("email_outbox_pending").on(table.status)]);

export const rateLimits = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: bigint("expires_at", {mode: "number"}).notNull(),
});
