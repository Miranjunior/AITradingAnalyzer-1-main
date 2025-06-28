import { WebSocket } from 'ws';
import { storage } from '../storage';
import { calculateIndicators } from './indicators';
import { 
  MarketData, 
  CandlestickData,
  TechnicalIndicators 
} from '../../shared/types/trading';

export class MarketDataService {
  private connections: Map<string, WebSocket> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private cache: Map<string, {
    data: MarketData;
    timestamp: number;
  }> = new Map();
  
  constructor() {
    // Limpar cache periodicamente
    setInterval(() => this.cleanCache(), 5 * 60 * 1000);
  }

  // Configuração de WebSocket
  private async setupWebSocket(symbol: string): Promise<WebSocket> {
    if (this.connections.has(symbol)) {
      return this.connections.get(symbol)!;
    }

    const ws = new WebSocket(process.env.BRAPI_WS_URL!);
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        action: 'subscribe',
        symbols: [symbol],
        fields: ['trade', 'quote', 'bar']
      }));
    });
    
    ws.on('message', (data: string) => {
      this.processRealtimeData(JSON.parse(data));
    });
    
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${symbol}:`, error);
      this.reconnectWebSocket(symbol);
    });
    
    this.connections.set(symbol, ws);
    return ws;
  }

  // Reconexão de WebSocket
  private async reconnectWebSocket(symbol: string) {
    const ws = this.connections.get(symbol);
    if (ws) {
      ws.terminate();
      this.connections.delete(symbol);
    }
    
    await this.setupWebSocket(symbol);
  }

  // Processamento de dados em tempo real
  private async processRealtimeData(data: any) {
    try {
      if (!this.validateMarketData(data)) {
        console.warn('Dados inválidos recebidos:', data);
        return;
      }
      
      const marketData: MarketData = this.transformMarketData(data);
      
      // Atualizar cache
      this.updateCache(marketData.symbol, marketData);
      
      // Persistir dados
      await storage.updateMarketData(marketData);
      
      // Calcular e atualizar indicadores
      await this.updateTechnicalIndicators(marketData.symbol);
      
    } catch (error) {
      console.error('Erro processando dados em tempo real:', error);
    }
  }

  // Validação de dados
  private validateMarketData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!data.symbol || typeof data.symbol !== 'string') return false;
    if (!data.price || isNaN(parseFloat(data.price))) return false;
    if (data.volume && isNaN(parseFloat(data.volume))) return false;
    
    return true;
  }

  // Transformação de dados
  private transformMarketData(data: any): MarketData {
    return {
      symbol: data.symbol,
      price: parseFloat(data.price).toFixed(8),
      volume: data.volume ? parseFloat(data.volume).toFixed(2) : '0',
      high: data.high ? parseFloat(data.high).toFixed(8) : data.price,
      low: data.low ? parseFloat(data.low).toFixed(8) : data.price,
      open: data.open ? parseFloat(data.open).toFixed(8) : data.price,
      previousClose: data.previousClose || data.price,
      timestamp: new Date().toISOString()
    };
  }

  // Gestão de cache
  private updateCache(symbol: string, data: MarketData) {
    this.cache.set(symbol, {
      data,
      timestamp: Date.now()
    });
  }

  private cleanCache() {
    const now = Date.now();
    for (const [symbol, entry] of this.cache.entries()) {
      if (now - entry.timestamp > 5 * 60 * 1000) {
        this.cache.delete(symbol);
      }
    }
  }

  // API Pública
  async getMarketData(symbol: string): Promise<MarketData> {
    // Verificar cache primeiro
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.data;
    }
    
    // Buscar dados atualizados
    try {
      const ws = await this.setupWebSocket(symbol);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'getQuote', symbol }));
      }
      
      const data = await storage.getLatestMarketData(symbol);
      return data;
      
    } catch (error) {
      console.error(`Erro obtendo dados para ${symbol}:`, error);
      throw new Error(`Falha ao obter dados de mercado para ${symbol}`);
    }
  }

  async subscribeToUpdates(symbol: string, interval: number = 30000) {
    if (this.updateIntervals.has(symbol)) {
      return;
    }
    
    await this.setupWebSocket(symbol);
    
    const intervalId = setInterval(async () => {
      try {
        await this.getMarketData(symbol);
      } catch (error) {
        console.error(`Erro na atualização de ${symbol}:`, error);
      }
    }, interval);
    
    this.updateIntervals.set(symbol, intervalId);
  }

  async unsubscribeFromUpdates(symbol: string) {
    const intervalId = this.updateIntervals.get(symbol);
    if (intervalId) {
      clearInterval(intervalId);
      this.updateIntervals.delete(symbol);
    }
    
    const ws = this.connections.get(symbol);
    if (ws) {
      ws.close();
      this.connections.delete(symbol);
    }
  }
}

export const marketData = new MarketDataService();
