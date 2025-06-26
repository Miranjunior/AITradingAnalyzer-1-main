import OpenAI from "openai";
import { storage } from "../storage";
import { InsertAIAnalysis, MarketData, TechnicalIndicators, CandlestickData } from "../../shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface PatternDetection {
  name: string;
  confidence: number;
  description: string;
  bullish: boolean;
}

interface AIAnalysisInput {
  symbol: string;
  marketData: MarketData;
  indicators: TechnicalIndicators;
  candlesticks: CandlestickData[];
  timeframe: string;
}

class AIAnalysisService {
  async generateAnalysis(input: AIAnalysisInput): Promise<InsertAIAnalysis> {
    try {
      const { symbol, marketData, indicators, candlesticks, timeframe } = input;
      
      // Detect patterns first
      const patterns = this.detectCandlestickPatterns(candlesticks);
      
      // Prepare context for AI
      const analysisContext = this.prepareAnalysisContext(input, patterns);
      
      // Get AI analysis
      const aiResponse = await this.callAIAnalysis(analysisContext);
      
      // Parse and validate AI response
      const parsedAnalysis = this.parseAIResponse(aiResponse);
      
      // Create analysis record
      const analysis: InsertAIAnalysis = {
        symbol,
        timeframe,
        recommendation: parsedAnalysis.recommendation,
        confidence: parsedAnalysis.confidence,
        entryPrice: parsedAnalysis.entryPrice?.toString(),
        stopLoss: parsedAnalysis.stopLoss?.toString(),
        takeProfit: parsedAnalysis.takeProfit?.toString(),
        summary: parsedAnalysis.summary,
        detailedAnalysis: parsedAnalysis.detailedAnalysis,
        patterns: patterns,
        sentiment: parsedAnalysis.sentiment,
        sentimentStrength: parsedAnalysis.sentimentStrength,
        riskLevel: parsedAnalysis.riskLevel,
      };

      // Store analysis
      await storage.createAIAnalysis(analysis);
      
      return analysis;
    } catch (error) {
      console.error(`Error generating AI analysis for ${input.symbol}:`, error);
      
      // Return fallback analysis
      return this.createFallbackAnalysis(input);
    }
  }

  private detectCandlestickPatterns(candlesticks: CandlestickData[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    
    if (candlesticks.length < 3) return patterns;

    const recent = candlesticks.slice(-5); // Last 5 candles for pattern analysis
    
    // Detect common patterns
    patterns.push(...this.detectHammerPattern(recent));
    patterns.push(...this.detectDojiPattern(recent));
    patterns.push(...this.detectEngulfingPattern(recent));
    patterns.push(...this.detectSupportResistancePattern(candlesticks));
    
    return patterns.filter(p => p.confidence > 60);
  }

  private detectHammerPattern(candles: CandlestickData[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const open = parseFloat(candle.open);
      const high = parseFloat(candle.high);
      const low = parseFloat(candle.low);
      const close = parseFloat(candle.close);
      
      const body = Math.abs(close - open);
      const upperShadow = high - Math.max(open, close);
      const lowerShadow = Math.min(open, close) - low;
      const totalRange = high - low;
      
      // Hammer: small body, long lower shadow, short upper shadow
      if (totalRange > 0 && body < totalRange * 0.3 && lowerShadow > body * 2 && upperShadow < body * 0.5) {
        const confidence = Math.min(95, 70 + (lowerShadow / body) * 5);
        patterns.push({
          name: close > open ? 'Hammer Bullish' : 'Hammer Bearish',
          confidence: Math.round(confidence),
          description: 'Strong reversal pattern detected',
          bullish: close > open
        });
      }
    }
    
    return patterns;
  }

  private detectDojiPattern(candles: CandlestickData[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const open = parseFloat(candle.open);
      const high = parseFloat(candle.high);
      const low = parseFloat(candle.low);
      const close = parseFloat(candle.close);
      
      const body = Math.abs(close - open);
      const totalRange = high - low;
      
      // Doji: very small body relative to range
      if (totalRange > 0 && body < totalRange * 0.1) {
        patterns.push({
          name: 'Doji',
          confidence: 75,
          description: 'Market indecision pattern',
          bullish: false // Neutral pattern
        });
      }
    }
    
    return patterns;
  }

  private detectEngulfingPattern(candles: CandlestickData[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const prev = candles[i - 1];
      const curr = candles[i];
      
      const prevOpen = parseFloat(prev.open);
      const prevClose = parseFloat(prev.close);
      const currOpen = parseFloat(curr.open);
      const currClose = parseFloat(curr.close);
      
      const prevBody = Math.abs(prevClose - prevOpen);
      const currBody = Math.abs(currClose - currOpen);
      
      // Bullish engulfing: prev red, curr green and engulfs prev
      if (prevClose < prevOpen && currClose > currOpen && 
          currOpen <= prevClose && currClose >= prevOpen && currBody > prevBody) {
        patterns.push({
          name: 'Bullish Engulfing',
          confidence: 85,
          description: 'Strong bullish reversal pattern',
          bullish: true
        });
      }
      
      // Bearish engulfing: prev green, curr red and engulfs prev
      if (prevClose > prevOpen && currClose < currOpen && 
          currOpen >= prevClose && currClose <= prevOpen && currBody > prevBody) {
        patterns.push({
          name: 'Bearish Engulfing',
          confidence: 85,
          description: 'Strong bearish reversal pattern',
          bullish: false
        });
      }
    }
    
    return patterns;
  }

  private detectSupportResistancePattern(candlesticks: CandlestickData[]): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    
    if (candlesticks.length < 10) return patterns;
    
    const prices = candlesticks.map(c => parseFloat(c.close));
    const currentPrice = prices[prices.length - 1];
    
    // Find potential support/resistance levels
    const levels = this.findKeyLevels(prices);
    
    levels.forEach(level => {
      const distance = Math.abs(currentPrice - level.price) / currentPrice;
      
      if (distance < 0.02) { // Within 2% of key level
        patterns.push({
          name: level.type === 'support' ? 'Near Support' : 'Near Resistance',
          confidence: Math.round(level.strength * 100),
          description: `Price approaching ${level.type} at ${level.price.toFixed(2)}`,
          bullish: level.type === 'support'
        });
      }
    });
    
    return patterns;
  }

  private findKeyLevels(prices: number[]): Array<{ price: number; type: 'support' | 'resistance'; strength: number }> {
    const levels: Array<{ price: number; type: 'support' | 'resistance'; strength: number }> = [];
    
    // Simple pivot point detection
    for (let i = 2; i < prices.length - 2; i++) {
      const current = prices[i];
      const left2 = prices[i - 2];
      const left1 = prices[i - 1];
      const right1 = prices[i + 1];
      const right2 = prices[i + 2];
      
      // Resistance (local high)
      if (current > left2 && current > left1 && current > right1 && current > right2) {
        levels.push({
          price: current,
          type: 'resistance',
          strength: 0.7
        });
      }
      
      // Support (local low)
      if (current < left2 && current < left1 && current < right1 && current < right2) {
        levels.push({
          price: current,
          type: 'support',
          strength: 0.7
        });
      }
    }
    
    return levels;
  }

  private prepareAnalysisContext(input: AIAnalysisInput, patterns: PatternDetection[]): string {
    const { symbol, marketData, indicators, candlesticks, timeframe } = input;
    
    const recentCandles = candlesticks.slice(-5);
    const priceChange = marketData.changePercent ? parseFloat(marketData.changePercent) : 0;
    
    return `
Você é um trader profissional com 20 anos de experiência e histórico de sucesso no mercado financeiro. 
Analise os seguintes dados técnicos com a expertise de um analista sênior:

DADOS DO ATIVO: ${symbol}
- Preço atual: ${marketData.price}
- Variação 24h: ${priceChange.toFixed(2)}%
- Volume: ${marketData.volume || 'N/A'}
- Máxima: ${marketData.high}
- Mínima: ${marketData.low}
- Timeframe: ${timeframe}

INDICADORES TÉCNICOS:
- RSI(14): ${indicators.rsi || 'N/A'}
- MACD: ${indicators.macd || 'N/A'}
- MACD Signal: ${indicators.macdSignal || 'N/A'}
- MA(20): ${indicators.ma20 || 'N/A'}
- MA(50): ${indicators.ma50 || 'N/A'}
- Bollinger Superior: ${indicators.bollingerUpper || 'N/A'}
- Bollinger Inferior: ${indicators.bollingerLower || 'N/A'}
- Estocástico: ${indicators.stochastic || 'N/A'}
- Williams %R: ${indicators.williamsR || 'N/A'}
- ADX: ${indicators.adx || 'N/A'}

PADRÕES IDENTIFICADOS:
${patterns.map(p => `- ${p.name}: ${p.confidence}% (${p.description})`).join('\n')}

DADOS RECENTES DE CANDLESTICK:
${recentCandles.map((c, i) => 
  `Candle ${i + 1}: O:${c.open} H:${c.high} L:${c.low} C:${c.close} V:${c.volume || 'N/A'}`
).join('\n')}

Forneça uma análise completa em formato JSON incluindo:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 0-100,
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number,
  "summary": "string (resumo em português, máximo 150 caracteres)",
  "detailedAnalysis": "string (análise detalhada em português)",
  "sentiment": "BULLISH|BEARISH|NEUTRAL",
  "sentimentStrength": 0-100,
  "riskLevel": "LOW|MEDIUM|HIGH",
  "reasoning": "string (justificativa técnica detalhada)"
}

Analise como um trader experiente, considerando:
1. Força da tendência atual
2. Níveis de suporte e resistência
3. Padrões de candlestick identificados
4. Divergências entre indicadores
5. Volume e momentum
6. Condições de sobrecompra/sobrevenda
7. Contexto de mercado atual

Seja preciso e objetivo na análise.`;
  }

  private async callAIAnalysis(context: string): Promise<string> {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: "Você é um analista técnico especialista em mercados financeiros. Analise os dados fornecidos e retorne uma análise técnica completa em formato JSON válido."
        },
        {
          role: "user",
          content: context
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500
    });

    return response.choices[0].message.content || "{}";
  }

  private parseAIResponse(response: string): any {
    try {
      const parsed = JSON.parse(response);
      
      // Validate and sanitize response
      return {
        recommendation: this.validateRecommendation(parsed.recommendation),
        confidence: this.validateConfidence(parsed.confidence),
        entryPrice: this.validatePrice(parsed.entryPrice),
        stopLoss: this.validatePrice(parsed.stopLoss),
        takeProfit: this.validatePrice(parsed.takeProfit),
        summary: this.validateString(parsed.summary, 150),
        detailedAnalysis: this.validateString(parsed.detailedAnalysis, 2000),
        sentiment: this.validateSentiment(parsed.sentiment),
        sentimentStrength: this.validateConfidence(parsed.sentimentStrength),
        riskLevel: this.validateRiskLevel(parsed.riskLevel),
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Invalid AI response format');
    }
  }

  private validateRecommendation(value: any): 'BUY' | 'SELL' | 'HOLD' {
    if (['BUY', 'SELL', 'HOLD'].includes(value)) return value;
    return 'HOLD';
  }

  private validateConfidence(value: any): number {
    const num = parseInt(value);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, num));
  }

  private validatePrice(value: any): number | null {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  private validateString(value: any, maxLength: number): string {
    if (typeof value !== 'string') return '';
    return value.substring(0, maxLength);
  }

  private validateSentiment(value: any): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    if (['BULLISH', 'BEARISH', 'NEUTRAL'].includes(value)) return value;
    return 'NEUTRAL';
  }

  private validateRiskLevel(value: any): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (['LOW', 'MEDIUM', 'HIGH'].includes(value)) return value;
    return 'MEDIUM';
  }

  private createFallbackAnalysis(input: AIAnalysisInput): InsertAIAnalysis {
    return {
      symbol: input.symbol,
      timeframe: input.timeframe,
      recommendation: 'HOLD',
      confidence: 50,
      summary: 'Análise indisponível no momento. Dados insuficientes para recomendação.',
      detailedAnalysis: 'Não foi possível gerar análise detalhada devido a limitações técnicas.',
      patterns: [],
      sentiment: 'NEUTRAL',
      sentimentStrength: 50,
      riskLevel: 'MEDIUM',
    };
  }

  async analyzeMultipleAssets(symbols: string[], timeframe: string = '1d'): Promise<void> {
    for (const symbol of symbols) {
      try {
        const marketData = await storage.getMarketData(symbol);
        const indicators = await storage.getTechnicalIndicators(symbol, timeframe);
        const candlesticks = await storage.getCandlestickData(symbol, timeframe, 50);

        if (marketData && indicators && candlesticks.length > 0) {
          await this.generateAnalysis({
            symbol,
            marketData,
            indicators,
            candlesticks,
            timeframe
          });
        }
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
      }
    }
  }
}

export const aiAnalysisService = new AIAnalysisService();
