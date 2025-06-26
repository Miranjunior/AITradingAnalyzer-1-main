import { pgTable, text, serial, decimal, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'stock', 'crypto', 'forex', 'etf', 'reit', 'binary_option', 'commodity'
  market: text("market").notNull(), // 'BR', 'US', 'CRYPTO'
  currency: text("currency").notNull().default('BRL'),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  previousClose: decimal("previous_close", { precision: 10, scale: 2 }),
  change: decimal("change", { precision: 10, scale: 2 }),
  changePercent: decimal("change_percent", { precision: 5, scale: 2 }),
  volume: integer("volume"),
  high: decimal("high", { precision: 10, scale: 2 }),
  low: decimal("low", { precision: 10, scale: 2 }),
  open: decimal("open", { precision: 10, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const technicalIndicators = pgTable("technical_indicators", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(), // '1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'
  rsi: decimal("rsi", { precision: 5, scale: 2 }),
  macd: decimal("macd", { precision: 10, scale: 4 }),
  macdSignal: decimal("macd_signal", { precision: 10, scale: 4 }),
  macdHistogram: decimal("macd_histogram", { precision: 10, scale: 4 }),
  ma20: decimal("ma20", { precision: 10, scale: 2 }),
  ma50: decimal("ma50", { precision: 10, scale: 2 }),
  ma200: decimal("ma200", { precision: 10, scale: 2 }),
  bollingerUpper: decimal("bollinger_upper", { precision: 10, scale: 2 }),
  bollingerMiddle: decimal("bollinger_middle", { precision: 10, scale: 2 }),
  bollingerLower: decimal("bollinger_lower", { precision: 10, scale: 2 }),
  stochastic: decimal("stochastic", { precision: 5, scale: 2 }),
  williamsR: decimal("williams_r", { precision: 5, scale: 2 }),
  adx: decimal("adx", { precision: 5, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const aiAnalysis = pgTable("ai_analysis", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  recommendation: text("recommendation").notNull(), // 'BUY', 'SELL', 'HOLD'
  confidence: integer("confidence").notNull(), // 0-100
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }),
  stopLoss: decimal("stop_loss", { precision: 10, scale: 2 }),
  takeProfit: decimal("take_profit", { precision: 10, scale: 2 }),
  summary: text("summary").notNull(),
  detailedAnalysis: text("detailed_analysis"),
  patterns: jsonb("patterns"), // Array of detected patterns
  sentiment: text("sentiment"), // 'BULLISH', 'BEARISH', 'NEUTRAL'
  sentimentStrength: integer("sentiment_strength"), // 0-100
  riskLevel: text("risk_level"), // 'LOW', 'MEDIUM', 'HIGH'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  symbol: text("symbol").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

export const candlestickData = pgTable("candlestick_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  open: decimal("open", { precision: 10, scale: 2 }).notNull(),
  high: decimal("high", { precision: 10, scale: 2 }).notNull(),
  low: decimal("low", { precision: 10, scale: 2 }).notNull(),
  close: decimal("close", { precision: 10, scale: 2 }).notNull(),
  volume: integer("volume"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  timestamp: true,
});

export const insertTechnicalIndicatorsSchema = createInsertSchema(technicalIndicators).omit({
  id: true,
  timestamp: true,
});

export const insertAIAnalysisSchema = createInsertSchema(aiAnalysis).omit({
  id: true,
  timestamp: true,
});

export const insertWatchlistSchema = createInsertSchema(watchlist).omit({
  id: true,
  addedAt: true,
});

export const insertCandlestickDataSchema = createInsertSchema(candlestickData).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type MarketData = typeof marketData.$inferSelect;
export type TechnicalIndicators = typeof technicalIndicators.$inferSelect;
export type AIAnalysis = typeof aiAnalysis.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type CandlestickData = typeof candlestickData.$inferSelect;

export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
export type InsertTechnicalIndicators = z.infer<typeof insertTechnicalIndicatorsSchema>;
export type InsertAIAnalysis = z.infer<typeof insertAIAnalysisSchema>;
export type InsertWatchlist = z.infer<typeof insertWatchlistSchema>;
export type InsertCandlestickData = z.infer<typeof insertCandlestickDataSchema>;
