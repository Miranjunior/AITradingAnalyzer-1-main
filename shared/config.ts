export const TIME_FRAMES = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'] as const;
export const CHART_TYPES = ['candlestick', 'line', 'area'] as const;
export const ASSET_TYPES = ['stock', 'crypto', 'forex', 'etf', 'reit', 'commodity', 'binary_option'] as const;

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
export const WS_BASE_URL = process.env.WS_BASE_URL || 'ws://localhost:3001';

export const MARKET_DATA_UPDATE_INTERVAL = 5000; // 5 seconds
export const TECHNICAL_INDICATORS_UPDATE_INTERVAL = 60000; // 1 minute
export const AI_ANALYSIS_UPDATE_INTERVAL = 300000; // 5 minutes

export const RISK_MANAGEMENT = {
  MAX_POSITION_SIZE: 0.02, // 2% of account size
  MAX_DRAWDOWN: 0.1, // 10% max drawdown
  DEFAULT_STOP_LOSS: 0.02, // 2% default stop loss
  DEFAULT_TAKE_PROFIT: 0.06, // 6% default take profit
  MIN_RISK_REWARD_RATIO: 2, // Minimum risk:reward ratio
};
