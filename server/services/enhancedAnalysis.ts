import { aiAnalysisService } from "./aiAnalysis";
import { storage } from "../storage";
import { InsertAIAnalysis, MarketData, TechnicalIndicators, CandlestickData } from "../../shared/schema";

// Serviço avançado para análises multi-timeframe e correlações conforme especificações do documento
class EnhancedAnalysisService {
  
  async performMultiTimeframeAnalysis(symbol: string): Promise<any> {
    const timeframes = ['1h', '4h', '1d'];
    const analyses: any[] = [];
    
    for (const timeframe of timeframes) {
      try {
        const marketData = await storage.getMarketData(symbol);
        const indicators = await storage.getTechnicalIndicators(symbol, timeframe);
        const candlesticks = await storage.getCandlestickData(symbol, timeframe, 50);
        
        if (marketData && indicators && candlesticks.length > 0) {
          const analysis = await aiAnalysisService.generateAnalysis({
            symbol,
            marketData,
            indicators,
            candlesticks,
            timeframe
          });
          
          analyses.push({
            timeframe,
            analysis: await storage.getAIAnalysis(symbol, timeframe)
          });
        }
      } catch (error) {
        console.error(`Error in multi-timeframe analysis for ${symbol} ${timeframe}:`, error);
      }
    }
    
    return this.correlateAnalyses(analyses);
  }
  
  private correlateAnalyses(analyses: any[]): any {
    if (analyses.length === 0) return null;
    
    const recommendations = analyses.map(a => a.analysis?.recommendation).filter(Boolean);
    const confidences = analyses.map(a => a.analysis?.confidence || 0);
    const sentiments = analyses.map(a => a.analysis?.sentiment).filter(Boolean);
    
    // Calcular consenso entre timeframes
    const buyCount = recommendations.filter(r => r === 'BUY').length;
    const sellCount = recommendations.filter(r => r === 'SELL').length;
    const holdCount = recommendations.filter(r => r === 'HOLD').length;
    
    let overallRecommendation = 'HOLD';
    if (buyCount > sellCount && buyCount > holdCount) {
      overallRecommendation = 'BUY';
    } else if (sellCount > buyCount && sellCount > holdCount) {
      overallRecommendation = 'SELL';
    }
    
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    return {
      symbol: analyses[0]?.analysis?.symbol,
      overallRecommendation,
      averageConfidence: Math.round(avgConfidence),
      timeframeAnalyses: analyses,
      consensusStrength: Math.max(buyCount, sellCount, holdCount) / analyses.length,
      summary: `Análise multi-timeframe indica ${overallRecommendation} com ${Math.round(avgConfidence)}% de confiança`
    };
  }
  
  async detectMarketRegime(symbol: string): Promise<string> {
    try {
      const indicators = await storage.getTechnicalIndicators(symbol, '1d');
      const candlesticks = await storage.getCandlestickData(symbol, '1d', 20);
      
      if (!indicators || candlesticks.length < 20) {
        return 'INSUFFICIENT_DATA';
      }
      
      const prices = candlesticks.map(c => parseFloat(c.close));
      const recentPrices = prices.slice(-10);
      const olderPrices = prices.slice(-20, -10);
      
      const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
      const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
      
      const trend = (recentAvg - olderAvg) / olderAvg;
      const rsi = parseFloat(indicators.rsi || '50');
      
      if (trend > 0.05 && rsi < 70) return 'UPTREND';
      if (trend < -0.05 && rsi > 30) return 'DOWNTREND';
      if (Math.abs(trend) < 0.02) return 'SIDEWAYS';
      
      return 'TRANSITION';
    } catch (error) {
      console.error('Error detecting market regime:', error);
      return 'UNKNOWN';
    }
  }
  
  async calculateRiskMetrics(symbol: string): Promise<any> {
    try {
      const candlesticks = await storage.getCandlestickData(symbol, '1d', 30);
      
      if (candlesticks.length < 20) {
        return {
          volatility: 0,
          maxDrawdown: 0,
          sharpeRatio: 0,
          riskLevel: 'UNKNOWN'
        };
      }
      
      const prices = candlesticks.map(c => parseFloat(c.close));
      const returns = [];
      
      for (let i = 1; i < prices.length; i++) {
        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
      }
      
      // Volatilidade (desvio padrão dos retornos)
      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((acc, ret) => acc + Math.pow(ret - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252); // Anualizada
      
      // Max Drawdown
      let peak = prices[0];
      let maxDrawdown = 0;
      
      for (const price of prices) {
        if (price > peak) {
          peak = price;
        } else {
          const drawdown = (peak - price) / peak;
          maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
      }
      
      // Sharpe Ratio simplificado (assumindo risk-free rate = 0)
      const sharpeRatio = avgReturn / Math.sqrt(variance);
      
      let riskLevel = 'MEDIUM';
      if (volatility > 0.4) riskLevel = 'HIGH';
      else if (volatility < 0.2) riskLevel = 'LOW';
      
      return {
        volatility: Math.round(volatility * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        riskLevel,
        avgDailyReturn: Math.round(avgReturn * 10000) / 100 // em basis points
      };
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      return {
        volatility: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        riskLevel: 'UNKNOWN'
      };
    }
  }
  
  async generateMarketSummary(): Promise<any> {
    const symbols = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4'];
    const summaries = [];
    
    for (const symbol of symbols) {
      try {
        const analysis = await storage.getAIAnalysis(symbol, '1d');
        const marketData = await storage.getMarketData(symbol);
        const regime = await this.detectMarketRegime(symbol);
        const risk = await this.calculateRiskMetrics(symbol);
        
        if (analysis && marketData) {
          summaries.push({
            symbol,
            price: parseFloat(marketData.price),
            change: parseFloat(marketData.changePercent || '0'),
            recommendation: analysis.recommendation,
            confidence: analysis.confidence,
            sentiment: analysis.sentiment,
            regime,
            riskLevel: risk.riskLevel,
            volatility: risk.volatility
          });
        }
      } catch (error) {
        console.error(`Error generating summary for ${symbol}:`, error);
      }
    }
    
    const bullishCount = summaries.filter(s => s.sentiment === 'BULLISH').length;
    const bearishCount = summaries.filter(s => s.sentiment === 'BEARISH').length;
    
    let marketSentiment = 'NEUTRAL';
    if (bullishCount > bearishCount) marketSentiment = 'BULLISH';
    else if (bearishCount > bullishCount) marketSentiment = 'BEARISH';
    
    return {
      overallSentiment: marketSentiment,
      activeSymbols: summaries.length,
      bullishCount,
      bearishCount,
      avgConfidence: Math.round(summaries.reduce((acc, s) => acc + s.confidence, 0) / summaries.length),
      topGainers: summaries.filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 3),
      topLosers: summaries.filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 3),
      highRiskAssets: summaries.filter(s => s.riskLevel === 'HIGH'),
      timestamp: new Date().toISOString()
    };
  }
}

export const enhancedAnalysisService = new EnhancedAnalysisService();