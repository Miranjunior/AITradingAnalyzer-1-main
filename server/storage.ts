import { 
  users, assets, marketData, technicalIndicators, aiAnalysis, 
  watchlist, candlestickData,
  type User, type InsertUser, type Asset, type InsertAsset,
  type MarketData, type InsertMarketData, type TechnicalIndicators, 
  type InsertTechnicalIndicators, type AIAnalysis, type InsertAIAnalysis,
  type Watchlist, type InsertWatchlist, type CandlestickData, 
  type InsertCandlestickData
} from "../shared/schema";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Asset management
  getAsset(symbol: string): Promise<Asset | undefined>;
  getAssets(): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  getAssetsByType(type: string): Promise<Asset[]>;

  // Market data
  getMarketData(symbol: string): Promise<MarketData | undefined>;
  getLatestMarketData(): Promise<MarketData[]>;
  createMarketData(data: InsertMarketData): Promise<MarketData>;
  updateMarketData(symbol: string, data: Partial<InsertMarketData>): Promise<MarketData | undefined>;

  // Technical indicators
  getTechnicalIndicators(symbol: string, timeframe: string): Promise<TechnicalIndicators | undefined>;
  createTechnicalIndicators(indicators: InsertTechnicalIndicators): Promise<TechnicalIndicators>;
  updateTechnicalIndicators(symbol: string, timeframe: string, indicators: Partial<InsertTechnicalIndicators>): Promise<TechnicalIndicators | undefined>;

  // AI Analysis
  getAIAnalysis(symbol: string, timeframe: string): Promise<AIAnalysis | undefined>;
  createAIAnalysis(analysis: InsertAIAnalysis): Promise<AIAnalysis>;
  getLatestAIAnalyses(): Promise<AIAnalysis[]>;

  // Watchlist
  getWatchlist(userId: number): Promise<Watchlist[]>;
  addToWatchlist(item: InsertWatchlist): Promise<Watchlist>;
  removeFromWatchlist(userId: number, symbol: string): Promise<boolean>;

  // Candlestick data
  getCandlestickData(symbol: string, timeframe: string, limit?: number): Promise<CandlestickData[]>;
  createCandlestickData(data: InsertCandlestickData): Promise<CandlestickData>;
}

export class MemStorage implements IStorage {
  private assets: Map<string, Asset> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private technicalIndicators: Map<string, TechnicalIndicators> = new Map();
  private aiAnalysis: Map<string, AIAnalysis> = new Map();
  private watchlists: Map<number, Watchlist[]> = new Map();
  private candlestickData: Map<string, CandlestickData[]> = new Map();
  private users: Map<number, User> = new Map();
  private userIdCounter = 1;
  private assetIdCounter = 1;
  private marketDataIdCounter = 1;
  private indicatorsIdCounter = 1;
  private analysisIdCounter = 1;
  private watchlistIdCounter = 1;
  private candlestickIdCounter = 1;

  constructor() {
    this.initializeDefaultAssets();
  }

  private initializeDefaultAssets() {
    const defaultAssets: InsertAsset[] = [
      { symbol: 'PETR4', name: 'Petrobras Petróleo Brasil S.A.', type: 'stock', market: 'BR', currency: 'BRL' },
      { symbol: 'VALE3', name: 'Vale S.A.', type: 'stock', market: 'BR', currency: 'BRL' },
      { symbol: 'ITUB4', name: 'Itaú Unibanco Holding S.A.', type: 'stock', market: 'BR', currency: 'BRL' },
      { symbol: 'BBDC4', name: 'Banco Bradesco S.A.', type: 'stock', market: 'BR', currency: 'BRL' },
      { symbol: 'BTCUSDT', name: 'Bitcoin', type: 'crypto', market: 'CRYPTO', currency: 'USDT' },
      { symbol: 'ETHUSDT', name: 'Ethereum', type: 'crypto', market: 'CRYPTO', currency: 'USDT' },
    ];

    defaultAssets.forEach(asset => {
      this.createAsset(asset);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Asset methods
  async getAsset(symbol: string): Promise<Asset | undefined> {
    return this.assets.get(symbol);
  }

  async getAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(asset => asset.isActive);
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.assetIdCounter++;
    const asset: Asset = { 
      ...insertAsset, 
      id, 
      currency: insertAsset.currency || 'BRL',
      isActive: true,
      createdAt: new Date()
    };
    this.assets.set(insertAsset.symbol, asset);
    return asset;
  }

  async getAssetsByType(type: string): Promise<Asset[]> {
    return Array.from(this.assets.values()).filter(asset => asset.type === type && asset.isActive);
  }

  // Market data methods
  async getMarketData(symbol: string): Promise<MarketData | undefined> {
    return this.marketData.get(symbol);
  }

  async getLatestMarketData(): Promise<MarketData[]> {
    return Array.from(this.marketData.values());
  }

  async createMarketData(insertData: InsertMarketData): Promise<MarketData> {
    const id = this.marketDataIdCounter++;
    const data: MarketData = { 
      ...insertData, 
      id, 
      previousClose: insertData.previousClose || null,
      change: insertData.change || null,
      changePercent: insertData.changePercent || null,
      volume: insertData.volume || null,
      high: insertData.high || null,
      low: insertData.low || null,
      open: insertData.open || null,
      timestamp: new Date()
    };
    this.marketData.set(insertData.symbol, data);
    return data;
  }

  async updateMarketData(symbol: string, updateData: Partial<InsertMarketData>): Promise<MarketData | undefined> {
    const existing = this.marketData.get(symbol);
    if (!existing) return undefined;

    const updated: MarketData = { 
      ...existing, 
      ...updateData,
      timestamp: new Date()
    };
    this.marketData.set(symbol, updated);
    return updated;
  }

  // Technical indicators methods
  async getTechnicalIndicators(symbol: string, timeframe: string): Promise<TechnicalIndicators | undefined> {
    const key = `${symbol}-${timeframe}`;
    return this.technicalIndicators.get(key);
  }

  async createTechnicalIndicators(insertIndicators: InsertTechnicalIndicators): Promise<TechnicalIndicators> {
    const id = this.indicatorsIdCounter++;
    const indicators: TechnicalIndicators = { 
      ...insertIndicators, 
      id, 
      rsi: insertIndicators.rsi || null,
      macd: insertIndicators.macd || null,
      macdSignal: insertIndicators.macdSignal || null,
      macdHistogram: insertIndicators.macdHistogram || null,
      ma20: insertIndicators.ma20 || null,
      ma50: insertIndicators.ma50 || null,
      ma200: insertIndicators.ma200 || null,
      bollingerUpper: insertIndicators.bollingerUpper || null,
      bollingerMiddle: insertIndicators.bollingerMiddle || null,
      bollingerLower: insertIndicators.bollingerLower || null,
      stochastic: insertIndicators.stochastic || null,
      williamsR: insertIndicators.williamsR || null,
      adx: insertIndicators.adx || null,
      timestamp: new Date()
    };
    const key = `${insertIndicators.symbol}-${insertIndicators.timeframe}`;
    this.technicalIndicators.set(key, indicators);
    return indicators;
  }

  async updateTechnicalIndicators(symbol: string, timeframe: string, updateData: Partial<InsertTechnicalIndicators>): Promise<TechnicalIndicators | undefined> {
    const key = `${symbol}-${timeframe}`;
    const existing = this.technicalIndicators.get(key);
    if (!existing) return undefined;

    const updated: TechnicalIndicators = { 
      ...existing, 
      ...updateData,
      timestamp: new Date()
    };
    this.technicalIndicators.set(key, updated);
    return updated;
  }

  // AI Analysis methods
  async getAIAnalysis(symbol: string, timeframe: string): Promise<AIAnalysis | undefined> {
    const key = `${symbol}-${timeframe}`;
    return this.aiAnalysis.get(key);
  }

  async createAIAnalysis(insertAnalysis: InsertAIAnalysis): Promise<AIAnalysis> {
    const id = this.analysisIdCounter++;
    const analysis: AIAnalysis = { 
      ...insertAnalysis, 
      id, 
      entryPrice: insertAnalysis.entryPrice || null,
      stopLoss: insertAnalysis.stopLoss || null,
      takeProfit: insertAnalysis.takeProfit || null,
      detailedAnalysis: insertAnalysis.detailedAnalysis || null,
      patterns: insertAnalysis.patterns || null,
      sentiment: insertAnalysis.sentiment || null,
      sentimentStrength: insertAnalysis.sentimentStrength || null,
      riskLevel: insertAnalysis.riskLevel || null,
      timestamp: new Date()
    };
    const key = `${insertAnalysis.symbol}-${insertAnalysis.timeframe}`;
    this.aiAnalysis.set(key, analysis);
    return analysis;
  }

  async getLatestAIAnalyses(): Promise<AIAnalysis[]> {
    return Array.from(this.aiAnalysis.values());
  }

  // Watchlist methods
  async getWatchlist(userId: number): Promise<Watchlist[]> {
    return this.watchlists.get(userId) || [];
  }

  async addToWatchlist(insertItem: InsertWatchlist): Promise<Watchlist> {
    const id = this.watchlistIdCounter++;
    const item: Watchlist = { 
      ...insertItem, 
      id, 
      userId: insertItem.userId || null,
      addedAt: new Date()
    };
    
    const userWatchlist = this.watchlists.get(insertItem.userId!) || [];
    userWatchlist.push(item);
    this.watchlists.set(insertItem.userId!, userWatchlist);
    
    return item;
  }

  async removeFromWatchlist(userId: number, symbol: string): Promise<boolean> {
    const userWatchlist = this.watchlists.get(userId);
    if (!userWatchlist) return false;

    const index = userWatchlist.findIndex(item => item.symbol === symbol);
    if (index === -1) return false;

    userWatchlist.splice(index, 1);
    return true;
  }

  // Candlestick data methods
  async getCandlestickData(symbol: string, timeframe: string, limit = 100): Promise<CandlestickData[]> {
    const key = `${symbol}-${timeframe}`;
    const data = this.candlestickData.get(key) || [];
    return data.slice(-limit);
  }

  async createCandlestickData(insertData: InsertCandlestickData): Promise<CandlestickData> {
    const id = this.candlestickIdCounter++;
    const data: CandlestickData = { 
      ...insertData, 
      id,
      volume: insertData.volume || null
    };
    
    const key = `${insertData.symbol}-${insertData.timeframe}`;
    const existingData = this.candlestickData.get(key) || [];
    existingData.push(data);
    
    // Keep only last 1000 candles per symbol-timeframe
    if (existingData.length > 1000) {
      existingData.shift();
    }
    
    this.candlestickData.set(key, existingData);
    return data;
  }
}

export const storage = new MemStorage();
