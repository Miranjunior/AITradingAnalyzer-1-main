// Trading related types and interfaces

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';

export type ChartType = 'candlestick' | 'line' | 'area';

export interface CandlestickData {
  symbol: string;
  timeframe: string;
  timestamp: Date;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: number;
}

export interface MarketData {
  symbol: string;
  price: string;
  previousClose?: string;
  change?: string;
  changePercent?: string;
  volume?: number;
  high?: string;
  low?: string;
  open?: string;
  marketCap?: number;
  updatedAt: Date;
}

export interface TechnicalIndicators {
  symbol: string;
  timeframe: string;
  rsi?: string;
  macd?: string;
  macdSignal?: string;
  macdHistogram?: string;
  sma20?: string;
  sma50?: string;
  ema20?: string;
  ema50?: string;
  bollingerUpper?: string;
  bollingerMiddle?: string;
  bollingerLower?: string;
  stochastic?: string;
  williamsR?: string;
  adx?: string;
  updatedAt: Date;
}

export interface AIAnalysis {
  symbol: string;
  timeframe: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning?: string;
  targetPrice?: string;
  stopLoss?: string;
  takeProfit?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  updatedAt: Date;
}

export interface Asset {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'forex' | 'etf' | 'reit' | 'commodity' | 'binary_option';
  market: string;
  currency: string;
  isActive: boolean;
}

export interface BinarySignal {
  id: number;
  symbol: string;
  direction: 'call' | 'put';
  confidence: number;
  timeframe: string;
  reasoning: string;
  expiresAt: string;
  createdAt: string;
}