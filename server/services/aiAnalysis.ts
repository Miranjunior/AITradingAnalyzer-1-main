// Tipos locais baseados nos tipos reais do projeto
import { AIAnalysis, PatternDetection, CandlestickData, TechnicalIndicators, MarketData } from '../../client/src/types/trading';
import { storage } from '../storage';

// Definir tipos auxiliares locais
interface AIAnalysisInput {
  symbol: string;
  marketData: MarketData;
  indicators: TechnicalIndicators;
  candlesticks: CandlestickData[];
  timeframe: string;
}

// Substituir InsertAIAnalysis por AIAnalysis
// Substituir Divergence por tipo local
interface Divergence {
  type: string;
  indicator: string;
  strength: number;
  description: string;
}

export class AIAnalysisService {
  // Método principal de análise
  async generateAnalysis(input: AIAnalysisInput): Promise<AIAnalysis> {
    try {
      const { symbol, marketData, indicators, candlesticks, timeframe } = input;
      // Detecção de padrões (apenas detectCandlestickPatterns)
      const patterns = this.detectCandlestickPatterns(candlesticks);
      // Análise de divergências (stub)
      const divergences: Divergence[] = [];
      // Análise de volume
      const volumeAnalysis = this.analyzeVolume(candlesticks);
      // Análise de volatilidade
      const volatility = this.calculateVolatility(candlesticks);
      // Níveis de risco
      const { stopLoss, takeProfit } = this.calculateRiskLevels(candlesticks, 'HOLD');
      // Montar análise
      const analysis: AIAnalysis = {
        symbol,
        timeframe,
        recommendation: 'HOLD',
        confidence: '50',
        summary: 'Análise simplificada',
        detailedAnalysis: 'Análise gerada sem IA',
        patterns,
        sentiment: 'NEUTRAL',
        riskLevel: 'MEDIUM',
        marketSentiment: '',
        newsImpact: '',
        updatedAt: new Date(),
      };
      await storage.createAIAnalysis(analysis as any);
      return analysis;
    } catch (error) {
      return this.createFallbackAnalysis(input);
    }
  }

  // Detecção de padrões de candlestick básicos melhorada
  private detectCandlestickPatterns(candles: CandlestickData[]): PatternDetection[] {
    // Implementação simplificada: retorna array vazio
    return [];
  }

  // Cálculo de volatilidade e ATR
  private calculateVolatility(candles: CandlestickData[]): number {
    const atr = this.calculateATR(candles, 14);
    const averagePrice = candles.reduce((sum, c) => 
      sum + parseFloat(c.close), 0) / candles.length;
    
    return (atr / averagePrice) * 100;
  }

  private calculateATR(candles: CandlestickData[], period: number): number {
    const trValues: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const high = parseFloat(candles[i].high);
      const low = parseFloat(candles[i].low);
      const prevClose = parseFloat(candles[i-1].close);
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      trValues.push(tr);
    }
    
    // Calcular ATR como média móvel dos TR
    return trValues
      .slice(-period)
      .reduce((sum, tr) => sum + tr, 0) / period;
  }

  // Cálculo de níveis de risco dinâmicos
  private calculateRiskLevels(candles: CandlestickData[], recommendation: string): {
    stopLoss: number;
    takeProfit: number;
  } {
    const atr = this.calculateATR(candles, 14);
    const currentPrice = parseFloat(candles[candles.length - 1].close);
    
    const multiplier = recommendation === 'BUY' ? 1 : -1;
    
    return {
      stopLoss: currentPrice - (multiplier * atr * 2),
      takeProfit: currentPrice + (multiplier * atr * 3)
    };
  }

  // Análise de Volume
  private analyzeVolume(candles: CandlestickData[]): {
    trend: 'increasing' | 'decreasing' | 'neutral';
    score: number;
    significance: 'high' | 'medium' | 'low';
  } {
    const volumes = candles.map(c => parseFloat(String(c.volume ?? '0')));
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / (volumes.length || 1);
    const recentVolume = volumes.slice(-5);
    const recentAvg = recentVolume.reduce((sum, v) => sum + v, 0) / (recentVolume.length || 1);
    
    const trend = recentAvg > avgVolume ? 'increasing' : 
                 recentAvg < avgVolume ? 'decreasing' : 'neutral';
                 
    const significance = recentAvg > avgVolume * 1.5 ? 'high' :
                        recentAvg > avgVolume * 1.2 ? 'medium' : 'low';
                        
    const score = (recentAvg / (avgVolume || 1)) * 0.7 + 0.3;
    
    return { trend, score, significance };
  }

  // Análise de fallback melhorada
  private createFallbackAnalysis(input: AIAnalysisInput): AIAnalysis {
    const { symbol, timeframe } = input;
    return {
      symbol,
      timeframe,
      recommendation: 'HOLD',
      confidence: '50',
      summary: 'Análise indisponível no momento',
      detailedAnalysis: 'Sistema em modo de fallback devido a erro na análise primária',
      patterns: [],
      sentiment: 'NEUTRAL',
      riskLevel: 'MEDIUM',
      marketSentiment: '',
      newsImpact: '',
      updatedAt: new Date(),
    };
  }
}

export const aiAnalysis = new AIAnalysisService();
