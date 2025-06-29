// Tipos locais baseados nos tipos reais do projeto
import { AIAnalysis } from '../../client/src/types/trading';

export interface TimeframeAnalysis {
  timeframe: string;
  analysis: AIAnalysis;
  weight: number;
}

export interface MarketRegime {
  type: 'TRENDING' | 'RANGING' | 'TRANSITIONING';
  direction?: 'UP' | 'DOWN';
  strength?: number;
  volatility: number;
  range?: { high: number; low: number };
  bias?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface CorrelationData {
  timeframe1: string;
  timeframe2: string;
  correlation: number;
  agreement: boolean;
}

export interface EnhancedAnalysis {
  symbol: string;
  timestamp: string;
  timeframeAnalyses: TimeframeAnalysis[];
  marketRegime: MarketRegime;
  correlations: CorrelationData[];
  signalConfirmation: {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    confirmations: string[];
  };
  volumeAnalysis: {
    trend: string;
    strength: number;
    abnormalVolume: boolean;
  };
  confidence: number;
}

import { aiAnalysis } from './aiAnalysis';
import { marketData } from './marketData';
import { storage } from '../storage';
// Importar tipos do frontend para uso nas funções utilitárias
import type { TechnicalIndicators, CandlestickData } from '../../client/src/types/trading';

// Copiar funções de normalização para este arquivo (evita import/export cross)
function normalizeIndicators(data: any): TechnicalIndicators | undefined {
  if (!data) return undefined;
  return {
    symbol: data.symbol,
    timeframe: data.timeframe,
    rsi: data.rsi ?? undefined,
    macd: data.macd ?? undefined,
    macdSignal: data.macdSignal ?? undefined,
    macdHistogram: data.macdHistogram ?? undefined,
    sma20: data.sma20 ?? data.ma20 ?? undefined,
    sma50: data.sma50 ?? data.ma50 ?? undefined,
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

export class EnhancedAnalysisService {
  private timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'];
  
  async generateEnhancedAnalysis(symbol: string): Promise<EnhancedAnalysis> {
    try {
      // Análise em múltiplos timeframes
      const timeframeAnalyses = await this.analyzeAllTimeframes(symbol);
      
      // Detectar regime de mercado
      const marketRegime = this.detectMarketRegime(timeframeAnalyses);
      
      // Análise de correlação entre timeframes
      const correlations = this.analyzeTimeframeCorrelations(timeframeAnalyses);
      
      // Confirmação de sinais
      const signalConfirmation = this.validateSignalsAcrossTimeframes(timeframeAnalyses);
      
      // Análise de volume agregada
      const volumeAnalysis = this.aggregateVolumeAnalysis(timeframeAnalyses);
      
      return {
        symbol,
        timestamp: new Date().toISOString(),
        timeframeAnalyses,
        marketRegime,
        correlations,
        signalConfirmation,
        volumeAnalysis,
        confidence: this.calculateOverallConfidence(timeframeAnalyses, correlations)
      };
      
    } catch (error) {
      console.error(`Erro na análise avançada para ${symbol}:`, error);
      throw error;
    }
  }

  private async analyzeAllTimeframes(symbol: string): Promise<TimeframeAnalysis[]> {
    const analyses = await Promise.all(
      this.timeframes.map(async (timeframe) => {
        try {
          const data = await marketData.getMarketData(symbol);
          const indicators = await storage.getTechnicalIndicators(symbol, timeframe);
          const candlesticks = await storage.getCandlestickData(symbol, timeframe, 100);
          // Corrigir chamada para IA:
          const analysis = await aiAnalysis.generateAnalysis({
            symbol,
            timeframe,
            marketData: data,
            indicators: normalizeIndicators(indicators)!,
            candlesticks: normalizeCandlesticks(candlesticks)
          });
          
          return {
            timeframe,
            analysis,
            weight: this.getTimeframeWeight(timeframe)
          };
        } catch (error) {
          console.error(`Erro analisando timeframe ${timeframe}:`, error);
          return null;
        }
      })
    );
    
    return analyses.filter((a): a is TimeframeAnalysis => a !== null);
  }

  private detectMarketRegime(analyses: TimeframeAnalysis[]): MarketRegime {
    const trendStrength = this.calculateTrendStrength(analyses);
    const volatility = this.calculateAggregateVolatility(analyses);
    
    if (trendStrength > 70) {
      return {
        type: 'TRENDING',
        direction: this.determineTrendDirection(analyses),
        strength: trendStrength,
        volatility
      };
    } else if (trendStrength < 30) {
      return {
        type: 'RANGING',
        range: this.calculateRange(analyses),
        volatility
      };
    } else {
      return {
        type: 'TRANSITIONING',
        bias: this.determineTrendBias(analyses),
        volatility
      };
    }
  }

  private analyzeTimeframeCorrelations(analyses: TimeframeAnalysis[]): CorrelationData[] {
    const correlations: CorrelationData[] = [];
    
    for (let i = 0; i < analyses.length - 1; i++) {
      for (let j = i + 1; j < analyses.length; j++) {
        const tf1 = analyses[i];
        const tf2 = analyses[j];
        
        correlations.push({
          timeframe1: tf1.timeframe,
          timeframe2: tf2.timeframe,
          correlation: this.calculateCorrelation(tf1, tf2),
          agreement: this.checkSignalAgreement(tf1, tf2)
        });
      }
    }
    
    return correlations;
  }

  private validateSignalsAcrossTimeframes(analyses: TimeframeAnalysis[]): {
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    confirmations: string[];
  } {
    const signals = analyses.map(a => ({
      signal: a.analysis.recommendation,
      weight: a.weight,
      confidence: a.analysis.confidence
    }));
    
    const weightedSignals = {
      BUY: 0,
      SELL: 0,
      HOLD: 0
    };
    
    // Corrigir multiplicação: garantir que s.confidence e s.weight são number
    signals.forEach(s => {
      const weight = typeof s.weight === 'string' ? parseFloat(s.weight) : s.weight;
      const confidence = typeof s.confidence === 'string' ? parseFloat(s.confidence) : s.confidence;
      if (s.signal === 'BUY' || s.signal === 'SELL' || s.signal === 'HOLD') {
        weightedSignals[s.signal] += weight * confidence;
      }
    });
    
    const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
    const normalizedSignals = {
      BUY: weightedSignals.BUY / totalWeight,
      SELL: weightedSignals.SELL / totalWeight,
      HOLD: weightedSignals.HOLD / totalWeight
    };
    
    const strongestSignal = Object.entries(normalizedSignals)
      .reduce((a, b) => a[1] > b[1] ? a : b);
    
    const confirmations = analyses
      .filter(a => a.analysis.recommendation === strongestSignal[0])
      .map(a => a.timeframe);
    
    return {
      signal: strongestSignal[0] as 'BUY' | 'SELL' | 'HOLD',
      confidence: strongestSignal[1] * 100,
      confirmations
    };
  }

  private aggregateVolumeAnalysis(analyses: TimeframeAnalysis[]): {
    trend: string;
    strength: number;
    abnormalVolume: boolean;
  } {
    // Corrigir acesso a volumeAnalysis: garantir existência ou usar valor padrão
    const volumeData = analyses.map(a => ({
      timeframe: a.timeframe,
      volume: (a.analysis as any).volumeAnalysis || {}
    }));
    
    const aggregateStrength = volumeData.reduce((sum, data) => 
      sum + (data.volume.score || 0), 0) / volumeData.length;
    
    const abnormalVolume = volumeData.some(data => 
      data.volume.significance === 'high');
    
    return {
      trend: this.determineVolumeTrend(volumeData),
      strength: aggregateStrength * 100,
      abnormalVolume
    };
  }

  private calculateOverallConfidence(
    analyses: TimeframeAnalysis[],
    correlations: CorrelationData[]
  ): number {
    const signalAgreement = this.calculateSignalAgreement(analyses);
    const correlationStrength = this.calculateCorrelationStrength(correlations);
    const trendStrength = this.calculateTrendStrength(analyses);
    
    return Math.round(
      (signalAgreement * 0.4) +
      (correlationStrength * 0.3) +
      (trendStrength * 0.3)
    );
  }

  private getTimeframeWeight(timeframe: string): number {
    const weights: {[key: string]: number} = {
      '1M': 1.0,
      '1w': 0.9,
      '1d': 0.8,
      '4h': 0.7,
      '1h': 0.6,
      '15m': 0.5,
      '5m': 0.4,
      '1m': 0.3
    };
    
    return weights[timeframe] || 0.5;
  }

  // Métodos auxiliares para cálculos específicos...
  private calculateTrendStrength(analyses: TimeframeAnalysis[]): number {
    // Implementação do cálculo de força da tendência
    return 0;
  }

  private calculateAggregateVolatility(analyses: TimeframeAnalysis[]): number {
    // Implementação do cálculo de volatilidade agregada
    return 0;
  }

  private determineTrendDirection(analyses: TimeframeAnalysis[]): 'UP' | 'DOWN' {
    // Implementação da determinação de direção da tendência
    return 'UP';
  }

  private calculateRange(analyses: TimeframeAnalysis[]): {
    high: number;
    low: number;
  } {
    // Implementação do cálculo de range
    return { high: 0, low: 0 };
  }

  private determineTrendBias(analyses: TimeframeAnalysis[]): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    // Implementação da determinação de viés da tendência
    return 'NEUTRAL';
  }

  private calculateCorrelation(tf1: TimeframeAnalysis, tf2: TimeframeAnalysis): number {
    // Implementação do cálculo de correlação
    return 0;
  }

  private checkSignalAgreement(tf1: TimeframeAnalysis, tf2: TimeframeAnalysis): boolean {
    // Implementação da verificação de concordância de sinais
    return false;
  }

  private determineVolumeTrend(volumeData: any[]): string {
    // Implementação da determinação de tendência do volume
    return 'neutral';
  }

  private calculateSignalAgreement(analyses: TimeframeAnalysis[]): number {
    // Implementação do cálculo de concordância de sinais
    return 0;
  }

  private calculateCorrelationStrength(correlations: CorrelationData[]): number {
    // Implementação do cálculo de força de correlação
    return 0;
  }
}

export const enhancedAnalysis = new EnhancedAnalysisService();
