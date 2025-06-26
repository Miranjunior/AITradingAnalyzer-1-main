import { z } from "zod";
import { pgTable, serial, text, decimal, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Binary Options specific tables
export const binaryOptions = pgTable("binary_options", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  underlyingAsset: text("underlying_asset").notNull(),
  expiryTime: timestamp("expiry_time").notNull(),
  strikePrice: decimal("strike_price", { precision: 10, scale: 5 }).notNull(),
  optionType: text("option_type").notNull(), // 'call', 'put'
  premium: decimal("premium", { precision: 10, scale: 5 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const binaryTrades = pgTable("binary_trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  optionId: integer("option_id").notNull(),
  investment: decimal("investment", { precision: 10, scale: 2 }).notNull(),
  prediction: text("prediction").notNull(), // 'higher', 'lower'
  entryPrice: decimal("entry_price", { precision: 10, scale: 5 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 10, scale: 5 }),
  payout: decimal("payout", { precision: 10, scale: 2 }),
  status: text("status").notNull().default('open'), // 'open', 'won', 'lost', 'expired'
  openedAt: timestamp("opened_at").defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const binarySignals = pgTable("binary_signals", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull(), // 'call', 'put'
  confidence: integer("confidence").notNull(), // 1-100
  timeframe: text("timeframe").notNull(), // '1m', '5m', '15m', '1h'
  reasoning: text("reasoning"),
  accuracy: decimal("accuracy", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Schema validation
export const insertBinaryOptionSchema = createInsertSchema(binaryOptions).omit({
  id: true,
  createdAt: true,
});

export const insertBinaryTradeSchema = createInsertSchema(binaryTrades).omit({
  id: true,
  openedAt: true,
  closedAt: true,
});

export const insertBinarySignalSchema = createInsertSchema(binarySignals).omit({
  id: true,
  createdAt: true,
});

// Types
export type BinaryOption = typeof binaryOptions.$inferSelect;
export type BinaryTrade = typeof binaryTrades.$inferSelect;
export type BinarySignal = typeof binarySignals.$inferSelect;

export type InsertBinaryOption = z.infer<typeof insertBinaryOptionSchema>;
export type InsertBinaryTrade = z.infer<typeof insertBinaryTradeSchema>;
export type InsertBinarySignal = z.infer<typeof insertBinarySignalSchema>;

// Binary options expiry times (in minutes)
export const BINARY_EXPIRY_TIMES = [1, 5, 15, 30, 60, 240] as const;
export type BinaryExpiryTime = typeof BINARY_EXPIRY_TIMES[number];

// Payout rates by asset type
export const PAYOUT_RATES = {
  forex: 0.85, // 85% payout
  crypto: 0.80, // 80% payout
  commodity: 0.83, // 83% payout
  stock: 0.82, // 82% payout
} as const;