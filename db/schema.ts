import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  payload: text("payload").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey(),
  mode: text("mode").notNull(),
  payload: text("payload").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("PLN"),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const bookings = sqliteTable("bookings", {
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
  createdAt: integer("created_at").notNull(),
  paidAt: integer("paid_at"),
}, (table) => [
  uniqueIndex("bookings_quote_unique").on(table.quoteId),
  uniqueIndex("bookings_token_unique").on(table.statusTokenHash),
  uniqueIndex("bookings_session_unique").on(table.sessionId),
]);

export const emailOutbox = sqliteTable("email_outbox", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  audience: text("audience").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lockedUntil: integer("locked_until"),
  providerId: text("provider_id"),
  createdAt: integer("created_at").notNull(),
  sentAt: integer("sent_at"),
}, (table) => [index("email_outbox_pending").on(table.status)]);

export const rateLimits = sqliteTable("rate_limits", {
  id: text("id").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
