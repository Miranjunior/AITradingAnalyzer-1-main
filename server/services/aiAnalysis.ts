import { OpenAI } from '@openai/api';
import { WebSocket } from 'ws';
import { 
  AIAnalysisInput, 
  InsertAIAnalysis, 
  PatternDetection,
  CandlestickData,
  TechnicalIndicators,
  Divergence,
  MarketData 
} from '../../shared/types/trading';
import { storage } from '../storage';
import { calculateIndicators } from './indicators';

const openai = new OpenAI();

export class AIAnalysisService {
  // Método principal de análise
  async generateAnalysis(input: AIAnalysisInput): Promise<InsertAIAnalysis> {
    try {
      const { symbol, marketData, indicators, candlesticks, timeframe } = input;
      
      // Detecção de padrões avançada
      const patterns = await this.detectAllPatterns(candlesticks);
      
      // Análise de divergências
      const divergences = this.detectDivergences(
        candlesticks.map(c => parseFloat(c.close)),
        indicators
      );
      
      // Análise de volume
      const volumeAnalysis = this.analyzeVolume(candlesticks);
      
      // Análise de volatilidade
      const volatility = this.calculateVolatility(candlesticks);
      
      // Detecção de suporte/resistência
      const levels = this.findKeyLevels(candlesticks);
      
      // Preparar contexto enriquecido para IA
      const analysisContext = this.prepareEnhancedContext({
        ...input,
        patterns,
        divergences,
        volumeAnalysis,
        volatility,
        levels
      });
      
      // Obter análise da IA
      const aiResponse = await this.callAIAnalysis(analysisContext);
      
      // Processar e validar resposta
      const parsedAnalysis = this.parseAIResponse(aiResponse);
      
      // Calcular score de confiança
      const confidence = this.calculateConfidenceScore(patterns, indicators, volumeAnalysis);
      
      // Calcular níveis de stop loss dinâmico baseado em ATR
      const { stopLoss, takeProfit } = this.calculateRiskLevels(candlesticks, parsedAnalysis.recommendation);
      
      // Criar registro de análise
      const analysis: InsertAIAnalysis = {
        symbol,
        timeframe,
        recommendation: parsedAnalysis.recommendation,
        confidence,
        entryPrice: parsedAnalysis.entryPrice?.toString(),
        stopLoss: stopLoss.toString(),
        takeProfit: takeProfit.toString(),
        summary: parsedAnalysis.summary,
        detailedAnalysis: parsedAnalysis.detailedAnalysis,
        patterns,
        divergences,
        volumeAnalysis,
        levels,
        sentiment: parsedAnalysis.sentiment,
        sentimentStrength: parsedAnalysis.sentimentStrength,
        riskLevel: this.calculateRiskLevel(volatility, confidence),
        volatility,
        timestamp: new Date().toISOString()
      };

      // Armazenar análise
      await storage.createAIAnalysis(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error(`Erro gerando análise IA para ${input.symbol}:`, error);
      return this.createFallbackAnalysis(input);
    }
  }

  // Detecção de todos os padrões
  private async detectAllPatterns(candlesticks: CandlestickData[]): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];
    
    if (candlesticks.length < 10) return patterns;

    // Padrões básicos
    patterns.push(...this.detectCandlestickPatterns(candlesticks));
    
    // Padrões avançados
    patterns.push(...this.detectAdvancedPatterns(candlesticks));
    
    // Fibonacci
    patterns.push(...this.detectFibonacciPatterns(candlesticks));
    
    // Filtrar por confiança e ordenar
    return patterns
      .filter(p => p.confidence > 60)
      .sort((a, b) => b.confidence - a.confidence);
  }

  // Detecção de padrões de candlestick básicos melhorada
  private detectCandlestickPatterns(candles: CandlestickData[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    
    for (let i = 0; i < candles.length - 2; i++) {
      const c1 = candles[i];
      const c2 = candles[i + 1];
      const c3 = candles[i + 2];
      
      // Padrão Hammer/Shooting Star
      this.detectSingleCandlePatterns(c2, patterns);
      
      // Padrões de duas velas
      this.detectTwoCandlePatterns(c1, c2, patterns);
      
      // Padrões de três velas
      this.detectThreeCandlePatterns(c1, c2, c3, patterns);
    }
    
    return patterns;
  }

  // Detecção de padrões avançados
  private detectAdvancedPatterns(candles: CandlestickData[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    
    // Head and Shoulders
    this.detectHeadAndShoulders(candles, patterns);
    
    // Double Top/Bottom
    this.detectDoublePatterns(candles, patterns);
    
    // Triangles
    this.detectTrianglePatterns(candles, patterns);
    
    return patterns;
  }

  // Detecção de padrões Fibonacci
  private detectFibonacciPatterns(candles: CandlestickData[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    const prices = candles.map(c => parseFloat(c.close));
    
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    const range = highPrice - lowPrice;
    
    const fibLevels = [0.236, 0.382, 0.5, 0.618, 0.786];
    const currentPrice = prices[prices.length - 1];
    
    fibLevels.forEach(level => {
      const fibPrice = highPrice - (range * level);
      const distance = Math.abs(currentPrice - fibPrice) / currentPrice;
      
      if (distance < 0.01) {
        patterns.push({
          name: `Fibonacci ${level * 100}%`,
          confidence: 80,
          description: `Preço próximo ao nível de Fibonacci ${level * 100}%`,
          bullish: currentPrice > fibPrice
        });
      }
    });
    
    return patterns;
  }

  // Detecção de divergências
  private detectDivergences(prices: number[], indicators: TechnicalIndicators): Divergence[] {
    const divergences: Divergence[] = [];
    
    // RSI Divergências
    if (indicators.rsi) {
      this.detectIndicatorDivergence(
        prices,
        indicators.rsi.split(',').map(Number),
        'RSI',
        divergences
      );
    }
    
    // MACD Divergências
    if (indicators.macd && indicators.macdSignal) {
      const macdValues = indicators.macd.split(',').map(Number);
      const signalValues = indicators.macdSignal.split(',').map(Number);
      
      this.detectIndicatorDivergence(
        prices,
        macdValues,
        'MACD',
        divergences
      );
    }
    
    return divergences;
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

  // Score de confiança melhorado
  private calculateConfidenceScore(
    patterns: PatternDetection[],
    indicators: TechnicalIndicators,
    volumeAnalysis: any
  ): number {
    let score = 0;
    let totalWeight = 0;
    
    // Peso dos padrões
    const patternScore = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    score += patternScore * 0.4;
    totalWeight += 0.4;
    
    // Peso dos indicadores
    const indicatorScore = this.calculateIndicatorAgreement(indicators);
    score += indicatorScore * 0.3;
    totalWeight += 0.3;
    
    // Peso do volume
    if (volumeAnalysis) {
      score += volumeAnalysis.score * 0.3;
      totalWeight += 0.3;
    }
    
    return Math.round((score / totalWeight) * 100);
  }

  // Análise de Volume
  private analyzeVolume(candles: CandlestickData[]): {
    trend: 'increasing' | 'decreasing' | 'neutral';
    score: number;
    significance: 'high' | 'medium' | 'low';
  } {
    const volumes = candles.map(c => parseFloat(c.volume || '0'));
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const recentVolume = volumes.slice(-5);
    const recentAvg = recentVolume.reduce((sum, v) => sum + v, 0) / 5;
    
    const trend = recentAvg > avgVolume ? 'increasing' : 
                 recentAvg < avgVolume ? 'decreasing' : 'neutral';
                 
    const significance = recentAvg > avgVolume * 1.5 ? 'high' :
                        recentAvg > avgVolume * 1.2 ? 'medium' : 'low';
                        
    const score = (recentAvg / avgVolume) * 0.7 + 0.3;
    
    return { trend, score, significance };
  }

  // Chamada à API OpenAI otimizada
  private async callAIAnalysis(context: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um analista técnico especialista com foco em análise quantitativa e qualitativa de mercados financeiros."
        },
        {
          role: "user",
          content: context
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000
    });

    return response.choices[0].message.content || "{}";
  }

  // Análise de fallback melhorada
  private createFallbackAnalysis(input: AIAnalysisInput): InsertAIAnalysis {
    const { symbol, timeframe } = input;
    
    return {
      symbol,
      timeframe,
      recommendation: 'HOLD',
      confidence: 50,
      summary: 'Análise indisponível no momento',
      detailedAnalysis: 'Sistema em modo de fallback devido a erro na análise primária',
      sentiment: 'NEUTRAL',
      sentimentStrength: 50,
      riskLevel: 'MEDIUM',
      patterns: [],
      timestamp: new Date().toISOString()
    };
  }
}

export const aiAnalysis = new AIAnalysisService();
