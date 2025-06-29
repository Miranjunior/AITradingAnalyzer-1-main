import { storage } from "../storage";
import { aiAnalysis } from "./aiAnalysis";
import { 
  InsertBinaryOption, 
  InsertBinarySignal, 
  InsertBinaryTrade,
  BINARY_EXPIRY_TIMES,
  PAYOUT_RATES,
  BinaryExpiryTime 
} from "../../shared/binaryOptions";
import { 
  CandlestickData, 
  TechnicalIndicators, 
  InsertMarketData 
} from "../../shared/types/trading";

// Importar funções de normalização do enhancedAnalysis ou routes
function normalizeMarketData(data: any): InsertMarketData | undefined {
  if (!data) return undefined;
  return {
    symbol: data.symbol,
    price: data.price,
    previousClose: data.previousClose ?? undefined,
    change: data.change ?? undefined,
    changePercent: data.changePercent ?? undefined,
    volume: typeof data.volume === 'number' ? data.volume : 0,
    high: data.high ?? undefined,
    low: data.low ?? undefined,
    open: data.open ?? undefined,
    marketCap: data.marketCap ?? undefined,
    updatedAt: data.updatedAt || data.timestamp || new Date(),
  };
}
function normalizeIndicators(data: any): TechnicalIndicators | undefined {
  if (!data) return undefined;
  return {
    symbol: data.symbol,
    timeframe: data.timeframe,
    rsi: data.rsi ?? undefined,
    macd: data.macd ?? undefined,
    macdSignal: data.macdSignal ?? undefined,
    macdHistogram: data.macdHistogram ?? undefined,
    sma20: data.sma20 ?? undefined,
    sma50: data.sma50 ?? undefined,
    ema20: data.ema20 ?? undefined,
    ema50: data.ema50 ?? undefined,
    bollingerUpper: data.bollingerUpper ?? undefined,
    bollingerMiddle: data.bollingerMiddle ?? undefined,
    bollingerLower: data.bollingerLower ?? undefined,
    stochastic: data.stochastic ?? undefined,
    williamsR: data.williamsR ?? undefined,
    adx: data.adx ?? undefined,
    updatedAt: data.updatedAt || data.timestamp || new Date(),
  };
}
function normalizeCandlesticks(arr: any[]): CandlestickData[] {
  return (arr || []).map(c => ({
    symbol: c.symbol,
    timeframe: c.timeframe,
    timestamp: c.timestamp || new Date(),
    open: c.open ?? '0',
    high: c.high ?? '0',
    low: c.low ?? '0',
    close: c.close ?? '0',
    volume: typeof c.volume === 'number' ? c.volume : 0,
  }));
}

class BinaryOptionsService {
  
  async generateBinarySignal(symbol: string, timeframe: string = '5m'): Promise<InsertBinarySignal | null> {
    try {
      // Get market data and indicators
      const marketData = await storage.getMarketData(symbol);
      const indicators = await storage.getTechnicalIndicators(symbol, timeframe);
      const candlesticks = await storage.getCandlestickData(symbol, timeframe, 20);
      
      if (!marketData || !indicators || candlesticks.length < 10) {
        return null;
      }
      
      // Generate AI analysis for binary trading
      const aiAnalysisResult = await aiAnalysis.generateAnalysis({
        symbol,
        marketData: normalizeMarketData(marketData)!,
        indicators: normalizeIndicators(indicators)!,
        candlesticks: normalizeCandlesticks(candlesticks),
        timeframe
      });
      
      // Convert AI recommendation to binary signal
      let direction: 'call' | 'put' = 'call';
      let confidence = 50;
      
      // Converter confidence para number
      if (aiAnalysisResult.recommendation === 'BUY') {
        direction = 'call';
        confidence = parseFloat(aiAnalysisResult.confidence);
      } else if (aiAnalysisResult.recommendation === 'SELL') {
        direction = 'put';
        confidence = parseFloat(aiAnalysisResult.confidence);
      } else {
        // For HOLD, use technical indicators
        const rsi = parseFloat(indicators.rsi || '50');
        if (rsi > 70) {
          direction = 'put';
          confidence = Math.min(80, 60 + (rsi - 70));
        } else if (rsi < 30) {
          direction = 'call';
          confidence = Math.min(80, 60 + (30 - rsi));
        }
      }
      
      // Calculate expiry time based on timeframe
      const expiryMinutes = this.getExpiryTime(timeframe as any);
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
      
      const signal: InsertBinarySignal = {
        symbol,
        direction,
        confidence: Math.round(confidence),
        timeframe,
        reasoning: aiAnalysisResult.reasoning || `${direction.toUpperCase()} signal based on ${aiAnalysisResult.recommendation} recommendation`,
        accuracy: null,
        isActive: true,
        expiresAt
      };
      
      return signal;
    } catch (error) {
      console.error('Error generating binary signal:', error);
      return null;
    }
  }
  
  async createBinaryOption(underlyingAsset: string, expiryMinutes: BinaryExpiryTime): Promise<InsertBinaryOption | null> {
    try {
      const marketData = await storage.getMarketData(underlyingAsset);
      if (!marketData) return null;
      
      const strikePrice = parseFloat(marketData.price);
      const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000);
      
      // Calculate premium based on volatility and time to expiry
      const asset = await storage.getAsset(underlyingAsset);
      const assetType = asset?.type || 'stock';
      const basePayout = PAYOUT_RATES[assetType as keyof typeof PAYOUT_RATES] || 0.80;
      
      // Adjust premium based on time to expiry (shorter time = higher premium)
      const timePremium = 1 + (60 - expiryMinutes) / 100;
      const premium = basePayout * timePremium;
      
      const binaryOption: InsertBinaryOption = {
        symbol: `${underlyingAsset}_${expiryMinutes}M`,
        underlyingAsset,
        expiryTime,
        strikePrice: strikePrice.toFixed(5),
        optionType: 'call', // Default to call, put will be generated separately
        premium: premium.toFixed(5),
        isActive: true
      };
      
      return binaryOption;
    } catch (error) {
      console.error('Error creating binary option:', error);
      return null;
    }
  }
  
  async executeBinaryTrade(
    userId: number, 
    optionSymbol: string, 
    prediction: 'higher' | 'lower', 
    investment: number
  ): Promise<InsertBinaryTrade | null> {
    try {
      // Extract underlying asset from option symbol
      const underlyingAsset = optionSymbol.split('_')[0];
      const marketData = await storage.getMarketData(underlyingAsset);
      
      if (!marketData) return null;
      
      const trade: InsertBinaryTrade = {
        userId,
        optionId: 1, // This would reference the actual option ID
        investment: investment.toFixed(2),
        prediction,
        entryPrice: parseFloat(marketData.price).toFixed(5),
        exitPrice: null,
        payout: null,
        status: 'open'
      };
      
      return trade;
    } catch (error) {
      console.error('Error executing binary trade:', error);
      return null;
    }
  }
  
  async calculateBinaryPayout(tradeId: number): Promise<number> {
    // This would calculate the payout based on the trade outcome
    // For now, return a sample calculation
    return 0;
  }
  
  async getActiveSignals(): Promise<any[]> {
    // Return active binary signals
    // This would query the database for active signals
    const signals = [
      {
        id: 1,
        symbol: 'EURUSD',
        direction: 'call',
        confidence: 78,
        timeframe: '5m',
        reasoning: 'Strong bullish momentum with RSI oversold recovery',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        createdAt: new Date()
      },
      {
        id: 2,
        symbol: 'BTCUSDT',
        direction: 'put',
        confidence: 82,
        timeframe: '15m',
        reasoning: 'Bearish divergence in MACD with resistance level rejection',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        createdAt: new Date()
      }
    ];
    
    return signals;
  }
  
  private getExpiryTime(timeframe: string): BinaryExpiryTime {
    const timeframeMap: Record<string, BinaryExpiryTime> = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240
    };
    
    return timeframeMap[timeframe] || 5;
  }
  
  async generateForexSignals(): Promise<any[]> {
    const forexPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'AUDUSD'];
    const signals = [];
    
    for (const pair of forexPairs) {
      const signal = await this.generateBinarySignal(pair, '5m');
      if (signal) {
        signals.push({
          ...signal,
          id: signals.length + 1,
          createdAt: new Date()
        });
      }
    }
    
    return signals;
  }
}

export const binaryOptionsService = new BinaryOptionsService();