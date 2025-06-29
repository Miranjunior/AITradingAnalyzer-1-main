import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MarketDataService } from "./services/marketData";
import { AIAnalysisService } from "./services/aiAnalysis";
import { mockDataService } from "./services/mockDataService";
import { EnhancedAnalysisService } from "./services/enhancedAnalysis";
import { binaryOptionsService } from "./services/binaryOptionsService";
import { z } from "zod";

// Importar tipos do frontend para uso nas funções utilitárias
import type { MarketData, TechnicalIndicators, CandlestickData } from '../client/src/types/trading';

const symbolSchema = z.string().min(1).max(20);
const timeframeSchema = z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M']);

const marketDataService = new MarketDataService();
const aiAnalysisService = new AIAnalysisService();
const enhancedAnalysisService = new EnhancedAnalysisService();

// Funções utilitárias corrigidas para garantir tipos do frontend
function normalizeMarketData(data: any): MarketData | undefined {
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

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all available assets
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.getAssets();
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  // Get assets by type
  app.get("/api/assets/type/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const assets = await storage.getAssetsByType(type);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching assets by type:", error);
      res.status(500).json({ error: "Failed to fetch assets by type" });
    }
  });

  // Get market data for a specific symbol
  app.get("/api/market-data/:symbol", async (req, res) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol.toUpperCase());
      
      // Try to get from storage first
      let marketData = await storage.getMarketData(symbol);
      
      // If not found or older than 5 minutes, fetch fresh data
      if (!marketData || (marketData.timestamp && new Date().getTime() - marketData.timestamp.getTime() > 300000)) {
        await marketDataService.getMarketData(symbol);
        marketData = await storage.getMarketData(symbol);
      }
      
      if (!marketData) {
        return res.status(404).json({ error: "Market data not found" });
      }
      
      res.json(normalizeMarketData(marketData));
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // Get latest market data for all assets
  app.get("/api/market-data", async (req, res) => {
    try {
      const marketData = await storage.getLatestMarketData();
      res.json(marketData);
    } catch (error) {
      console.error("Error fetching all market data:", error);
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // Get technical indicators
  app.get("/api/indicators/:symbol/:timeframe", async (req, res) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol.toUpperCase());
      const timeframe = timeframeSchema.parse(req.params.timeframe);
      
      let indicators = await storage.getTechnicalIndicators(symbol, timeframe);
      
      // If not found or older than 15 minutes, update indicators
      if (!indicators || (indicators.timestamp && new Date().getTime() - indicators.timestamp.getTime() > 900000)) {
        // Aqui, apenas busque market data para atualizar, pois updateTechnicalIndicators não existe
        await marketDataService.getMarketData(symbol);
        indicators = await storage.getTechnicalIndicators(symbol, timeframe);
      }
      
      if (!indicators) {
        return res.status(404).json({ error: "Technical indicators not found" });
      }
      
      res.json(normalizeIndicators(indicators));
    } catch (error) {
      console.error("Error fetching technical indicators:", error);
      res.status(500).json({ error: "Failed to fetch technical indicators" });
    }
  });

  // Get AI analysis
  app.get("/api/analysis/:symbol/:timeframe", async (req, res) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol.toUpperCase());
      const timeframe = timeframeSchema.parse(req.params.timeframe);
      
      let analysis = await storage.getAIAnalysis(symbol, timeframe);
      
      // If not found or older than 30 minutes, generate new analysis
      if (!analysis || (analysis.timestamp && new Date().getTime() - analysis.timestamp.getTime() > 1800000)) {
        const marketData = await storage.getMarketData(symbol);
        const indicators = await storage.getTechnicalIndicators(symbol, timeframe);
        const candlesticks = await storage.getCandlestickData(symbol, timeframe, 50);
        
        if (marketData && indicators && candlesticks.length > 0) {
          const generatedAnalysis = await aiAnalysisService.generateAnalysis({
            symbol,
            marketData: normalizeMarketData(marketData)!,
            indicators: normalizeIndicators(indicators)!,
            candlesticks: normalizeCandlesticks(candlesticks),
            timeframe
          });
          analysis = await storage.getAIAnalysis(symbol, timeframe);
        }
      }
      
      if (!analysis) {
        return res.status(404).json({ error: "AI analysis not available" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      res.status(500).json({ error: "Failed to fetch AI analysis" });
    }
  });

  // Get candlestick data
  app.get("/api/candlesticks/:symbol/:timeframe", async (req, res) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol.toUpperCase());
      const timeframe = timeframeSchema.parse(req.params.timeframe);
      const limit = parseInt(req.query.limit as string) || 100;
      
      let candlesticks = await storage.getCandlestickData(symbol, timeframe, limit);
      
      // If no data, try to fetch historical data
      if (candlesticks.length === 0) {
        await marketDataService.getMarketData(symbol);
        candlesticks = await storage.getCandlestickData(symbol, timeframe, limit);
      }
      
      res.json(normalizeCandlesticks(candlesticks));
    } catch (error) {
      console.error("Error fetching candlestick data:", error);
      res.status(500).json({ error: "Failed to fetch candlestick data" });
    }
  });

  // Refresh data for a symbol
  app.post("/api/refresh/:symbol", async (req, res) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol.toUpperCase());
      const timeframe = req.body.timeframe || '1d';
      
      // Fetch fresh market data
      await marketDataService.getMarketData(symbol);
      // Update technical indicators (não existe, apenas busque market data)
      await marketDataService.getMarketData(symbol);
      
      // Generate new AI analysis
      const marketData = await storage.getMarketData(symbol);
      const indicators = await storage.getTechnicalIndicators(symbol, timeframe);
      const candlesticks = await storage.getCandlestickData(symbol, timeframe, 50);
      
      if (marketData && indicators && candlesticks.length > 0) {
        await aiAnalysisService.generateAnalysis({
          symbol,
          marketData: normalizeMarketData(marketData)!,
          indicators: normalizeIndicators(indicators)!,
          candlesticks: normalizeCandlesticks(candlesticks),
          timeframe
        });
      }
      
      res.json({ success: true, message: "Data refreshed successfully" });
    } catch (error) {
      console.error("Error refreshing data:", error);
      res.status(500).json({ error: "Failed to refresh data" });
    }
  });

  // Get watchlist (simplified for demo)
  app.get("/api/watchlist", async (req, res) => {
    try {
      // For demo purposes, return a default watchlist
      const defaultSymbols = ['PETR4', 'VALE3', 'ITUB4', 'BTCUSDT'];
      const watchlistData = [];
      
      for (const symbol of defaultSymbols) {
        const marketData = await storage.getMarketData(symbol);
        const analysis = await storage.getAIAnalysis(symbol, '1d');
        
        if (marketData) {
          watchlistData.push({
            symbol,
            marketData,
            analysis
          });
        }
      }
      
      res.json(watchlistData);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ error: "Failed to fetch watchlist" });
    }
  });

  // Market status endpoint
  app.get("/api/market-status", async (req, res) => {
    try {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Simple market hours check (Brazil time)
      const isMarketOpen = (day >= 1 && day <= 5) && (hour >= 10 && hour < 17);
      
      res.json({
        isOpen: isMarketOpen,
        status: isMarketOpen ? 'OPEN' : 'CLOSED',
        timestamp: now.toISOString()
      });
    } catch (error) {
      console.error("Error fetching market status:", error);
      res.status(500).json({ error: "Failed to fetch market status" });
    }
  });

  // Enhanced analysis endpoints
  app.get("/api/enhanced-analysis/:symbol", async (req, res) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol.toUpperCase());
      const enhancedAnalysis = await enhancedAnalysisService.generateEnhancedAnalysis(symbol);
      res.json(enhancedAnalysis);
    } catch (error) {
      console.error("Error fetching enhanced analysis:", error);
      res.status(500).json({ error: "Failed to fetch enhanced analysis" });
    }
  });

  // Market summary endpoint
  app.get("/api/market-summary", async (req, res) => {
    try {
      // Example: summarize for a default set of symbols
      const defaultSymbols = ['PETR4', 'VALE3', 'ITUB4', 'BTCUSDT'];
      const summary = await Promise.all(
        defaultSymbols.map(async (symbol) => {
          try {
            return await enhancedAnalysisService.generateEnhancedAnalysis(symbol);
          } catch (e) {
            return { symbol, error: 'Failed to analyze' };
          }
        })
      );
      res.json(summary);
    } catch (error) {
      console.error("Error generating market summary:", error);
      res.status(500).json({ error: "Failed to generate market summary" });
    }
  });

  // Binary Options endpoints
  app.get("/api/binary-signals", async (req, res) => {
    try {
      const signals = await binaryOptionsService.getActiveSignals();
      res.json(signals);
    } catch (error) {
      console.error("Error fetching binary signals:", error);
      res.status(500).json({ error: "Failed to fetch binary signals" });
    }
  });

  app.get("/api/forex-signals", async (req, res) => {
    try {
      const signals = await binaryOptionsService.generateForexSignals();
      res.json(signals);
    } catch (error) {
      console.error("Error generating forex signals:", error);
      res.status(500).json({ error: "Failed to generate forex signals" });
    }
  });

  app.post("/api/binary-signal/:symbol", async (req, res) => {
    try {
      const symbol = symbolSchema.parse(req.params.symbol.toUpperCase());
      const { timeframe = '5m' } = req.body;
      
      const signal = await binaryOptionsService.generateBinarySignal(symbol, timeframe);
      if (!signal) {
        return res.status(404).json({ error: "Unable to generate signal for this asset" });
      }
      
      res.json(signal);
    } catch (error) {
      console.error("Error generating binary signal:", error);
      res.status(500).json({ error: "Failed to generate binary signal" });
    }
  });

  app.post("/api/binary-trade", async (req, res) => {
    try {
      const { userId, optionSymbol, prediction, investment } = req.body;
      
      if (!userId || !optionSymbol || !prediction || !investment) {
        return res.status(400).json({ error: "Missing required trade parameters" });
      }
      
      const trade = await binaryOptionsService.executeBinaryTrade(
        userId,
        optionSymbol,
        prediction,
        parseFloat(investment)
      );
      
      if (!trade) {
        return res.status(400).json({ error: "Unable to execute trade" });
      }
      
      res.json(trade);
    } catch (error) {
      console.error("Error executing binary trade:", error);
      res.status(500).json({ error: "Failed to execute trade" });
    }
  });

  // Initialize default data on startup
  setTimeout(async () => {
    try {
      console.log("Initializing market data...");
      const defaultSymbols = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4'];
      
      // Try to fetch real data first, fallback to mock data if API fails
      const fetchResults = await Promise.allSettled(
        defaultSymbols.map(symbol => marketDataService.getMarketData(symbol))
      );
      
      const hasRealData = fetchResults.some(result => result.status === 'fulfilled' && result.value !== null);
      
      if (!hasRealData) {
        console.log("Real market data unavailable, initializing demonstration data...");
        await mockDataService.initializeMockData();
        mockDataService.startPriceUpdates();
      }
      
      // Update technical indicators for available data
      for (const symbol of defaultSymbols) {
        await marketDataService.getMarketData(symbol);
      }
      
      console.log("Market data initialization completed");
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }, 5000);

  const httpServer = createServer(app);
  return httpServer;
}
