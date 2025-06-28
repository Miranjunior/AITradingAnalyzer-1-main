import { SystemConfig } from '../types/system';

export const config: SystemConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  wsBaseUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
  refreshInterval: 5000, // 5 segundos
  timeframes: ['1m', '5m', '15m', '1h', '4h', '1d'],
  defaultTimeframe: '1h'
};

export const API_ENDPOINTS = {
  market: {
    data: '/api/market/data',
    candles: '/api/market/candles',
    ticker: '/api/market/ticker'
  },
  analysis: {
    technical: '/api/analysis/technical',
    sentiment: '/api/analysis/sentiment',
    ai: '/api/analysis/ai'
  },
  risk: {
    calculate: '/api/risk/calculate',
    metrics: '/api/risk/metrics',
    analysis: '/api/risk/analysis'
  },
  user: {
    preferences: '/api/user/preferences',
    watchlist: '/api/user/watchlist',
    alerts: '/api/user/alerts'
  }
};
