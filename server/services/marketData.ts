import { storage } from "../storage";
import { InsertMarketData, InsertTechnicalIndicators, InsertCandlestickData } from "../../shared/schema";

const BRAPI_BASE_URL = 'https://brapi.dev/api';
const BRAPI_API_KEY = process.env.BRAPI_API_KEY || '';

// Fallback to demo mode if no API key is provided
const DEMO_MODE = !BRAPI_API_KEY;

export interface BrapiQuoteResponse {
  results: Array<{
    symbol: string;
    shortName: string;
    longName: string;
    currency: string;
    regularMarketPrice: number;
    regularMarketPreviousClose: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketVolume: number;
    regularMarketHigh: number;
    regularMarketLow: number;
    regularMarketOpen: number;
    marketCap: number;
    priceEarnings: number;
    earningsPerShare: number;
    logourl: string;
  }>;
  requestedAt: string;
  took: string;
}

export interface BrapiHistoricalResponse {
  results: Array<{
    symbol: string;
    historical: Array<{
      date: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      adjustedClose: number;
    }>;
  }>;
}

class MarketDataService {
  private async fetchFromBrapi(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${BRAPI_BASE_URL}${endpoint}`);
    
    // Add API key if available
    if (BRAPI_API_KEY) {
      params.token = BRAPI_API_KEY;
    }
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`BRAPI API error: ${response.status} ${response.statusText} for URL: ${url.toString()}`);
      throw new Error(`BRAPI API error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Expected JSON but got: ${contentType}`, text.substring(0, 500));
      throw new Error(`BRAPI API returned non-JSON response: ${contentType}`);
    }

    return response.json();
  }

  async fetchQuote(symbol: string): Promise<InsertMarketData | null> {
    try {
      // If no API key is available, return null to trigger mock data fallback
      if (DEMO_MODE) {
        console.log(`Demo mode: skipping API call for ${symbol}`);
        return null;
      }

      const response: BrapiQuoteResponse = await this.fetchFromBrapi(`/quote/${symbol}`, {
        modules: 'summaryProfile',
        token: BRAPI_API_KEY
      });

      if (!response.results || response.results.length === 0) {
        return null;
      }

      const quote = response.results[0];
      
      const marketData: InsertMarketData = {
        symbol: quote.symbol,
        price: quote.regularMarketPrice.toString(),
        previousClose: quote.regularMarketPreviousClose?.toString(),
        change: quote.regularMarketChange?.toString(),
        changePercent: quote.regularMarketChangePercent?.toString(),
        volume: quote.regularMarketVolume,
        high: quote.regularMarketHigh?.toString(),
        low: quote.regularMarketLow?.toString(),
        open: quote.regularMarketOpen?.toString(),
      };

      // Store in database
      await storage.createMarketData(marketData);
      
      return marketData;
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  async fetchHistoricalData(symbol: string, period: string = '1mo'): Promise<InsertCandlestickData[]> {
    try {
      // If no API key is available, return empty array to trigger mock data fallback
      if (DEMO_MODE) {
        console.log(`Demo mode: skipping historical data API call for ${symbol}`);
        return [];
      }

      const response: BrapiHistoricalResponse = await this.fetchFromBrapi(`/quote/${symbol}`, {
        range: period,
        interval: '1d',
        modules: 'history',
        token: BRAPI_API_KEY
      });

      if (!response.results || response.results.length === 0) {
        return [];
      }

      const result = response.results[0];
      const candlesticks: InsertCandlestickData[] = [];

      if (result.historical) {
        result.historical.forEach(candle => {
          candlesticks.push({
            symbol: result.symbol,
            timeframe: '1d',
            timestamp: new Date(candle.date * 1000),
            open: candle.open.toString(),
            high: candle.high.toString(),
            low: candle.low.toString(),
            close: candle.close.toString(),
            volume: candle.volume,
          });
        });

        // Store in database
        for (const candle of candlesticks) {
          await storage.createCandlestickData(candle);
        }
      }

      return candlesticks;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  calculateTechnicalIndicators(prices: number[], volumes: number[] = []): Partial<InsertTechnicalIndicators> {
    if (prices.length < 20) {
      return {};
    }

    // Simple Moving Averages
    const ma20 = this.calculateSMA(prices, 20);
    const ma50 = prices.length >= 50 ? this.calculateSMA(prices, 50) : null;
    const ma200 = prices.length >= 200 ? this.calculateSMA(prices, 200) : null;

    // RSI
    const rsi = this.calculateRSI(prices, 14);

    // MACD
    const macd = this.calculateMACD(prices);

    // Bollinger Bands
    const bollinger = this.calculateBollingerBands(prices, 20, 2);

    // Stochastic
    const stochastic = this.calculateStochastic(prices, 14);

    // Williams %R
    const williamsR = this.calculateWilliamsR(prices, 14);

    // ADX (simplified)
    const adx = this.calculateADX(prices, 14);

    return {
      rsi: rsi?.toString(),
      macd: macd?.macd.toString(),
      macdSignal: macd?.signal.toString(),
      macdHistogram: macd?.histogram.toString(),
      ma20: ma20?.toString(),
      ma50: ma50?.toString(),
      ma200: ma200?.toString(),
      bollingerUpper: bollinger?.upper.toString(),
      bollingerMiddle: bollinger?.middle.toString(),
      bollingerLower: bollinger?.lower.toString(),
      stochastic: stochastic?.toString(),
      williamsR: williamsR?.toString(),
      adx: adx?.toString(),
    };
  }

  private calculateSMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateRSI(prices: number[], period: number): number | null {
    if (prices.length < period + 1) return null;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } | null {
    if (prices.length < 26) return null;

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (!ema12 || !ema26) return null;

    const macd = ema12 - ema26;
    
    // For simplicity, using SMA instead of EMA for signal line
    const macdLine = [macd];
    const signal = this.calculateSMA(macdLine, 9) || macd;
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  private calculateEMA(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number, stdDev: number): { upper: number; middle: number; lower: number } | null {
    if (prices.length < period) return null;

    const sma = this.calculateSMA(prices, period);
    if (!sma) return null;

    const recentPrices = prices.slice(-period);
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  private calculateStochastic(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const recentPrices = prices.slice(-period);
    const highest = Math.max(...recentPrices);
    const lowest = Math.min(...recentPrices);
    const current = prices[prices.length - 1];

    if (highest === lowest) return 50;

    return ((current - lowest) / (highest - lowest)) * 100;
  }

  private calculateWilliamsR(prices: number[], period: number): number | null {
    if (prices.length < period) return null;

    const recentPrices = prices.slice(-period);
    const highest = Math.max(...recentPrices);
    const lowest = Math.min(...recentPrices);
    const current = prices[prices.length - 1];

    if (highest === lowest) return -50;

    return ((highest - current) / (highest - lowest)) * -100;
  }

  private calculateADX(prices: number[], period: number): number | null {
    // Simplified ADX calculation
    if (prices.length < period + 1) return null;

    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(Math.abs(prices[i] - prices[i - 1]));
    }

    const avgChange = changes.slice(-period).reduce((a, b) => a + b, 0) / period;
    const totalRange = Math.max(...prices.slice(-period)) - Math.min(...prices.slice(-period));
    
    if (totalRange === 0) return 0;
    
    return (avgChange / totalRange) * 100;
  }

  async updateTechnicalIndicators(symbol: string, timeframe: string): Promise<void> {
    try {
      const candlesticks = await storage.getCandlestickData(symbol, timeframe, 200);
      if (candlesticks.length < 20) return;

      const prices = candlesticks.map(c => parseFloat(c.close));
      const volumes = candlesticks.map(c => c.volume || 0);

      const indicators = this.calculateTechnicalIndicators(prices, volumes);
      
      const indicatorsData: InsertTechnicalIndicators = {
        symbol,
        timeframe,
        ...indicators
      };

      // Check if indicators already exist
      const existing = await storage.getTechnicalIndicators(symbol, timeframe);
      if (existing) {
        await storage.updateTechnicalIndicators(symbol, timeframe, indicators);
      } else {
        await storage.createTechnicalIndicators(indicatorsData);
      }
    } catch (error) {
      console.error(`Error updating technical indicators for ${symbol}:`, error);
    }
  }

  async fetchMultipleQuotes(symbols: string[]): Promise<void> {
    const promises = symbols.map(symbol => this.fetchQuote(symbol));
    await Promise.allSettled(promises);
  }
}

export const marketDataService = new MarketDataService();
