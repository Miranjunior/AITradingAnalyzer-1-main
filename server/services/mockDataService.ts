import { storage } from "../storage";
import { InsertMarketData, InsertCandlestickData } from "../../shared/schema";

// Serviço para gerar dados de demonstração realistas quando a API BRAPI não estiver disponível
class MockDataService {
  private generateRealisticPrice(basePrice: number, volatility: number = 0.02): number {
    const change = (Math.random() - 0.5) * 2 * volatility;
    return basePrice * (1 + change);
  }

  private generateCandlestickData(symbol: string, basePrice: number, days: number = 30): InsertCandlestickData[] {
    const data: InsertCandlestickData[] = [];
    let currentPrice = basePrice;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(9, 0, 0, 0); // Market open time
      
      const open = currentPrice;
      const volatility = 0.03;
      const high = open * (1 + Math.random() * volatility);
      const low = open * (1 - Math.random() * volatility);
      const close = this.generateRealisticPrice(open, volatility);
      const volume = Math.floor(Math.random() * 10000000) + 1000000;
      
      data.push({
        symbol,
        timeframe: '1d',
        timestamp: date,
        open: open.toFixed(2),
        high: high.toFixed(2),
        low: low.toFixed(2),
        close: close.toFixed(2),
        volume
      });
      
      currentPrice = close;
    }
    
    return data;
  }

  async initializeMockData(): Promise<void> {
    const mockAssets = [
      // Brazilian stocks
      { symbol: 'PETR4', name: 'Petrobras Petróleo Brasil S.A.', basePrice: 32.45 },
      { symbol: 'VALE3', name: 'Vale S.A.', basePrice: 65.20 },
      { symbol: 'ITUB4', name: 'Itaú Unibanco Holding S.A.', basePrice: 25.80 },
      { symbol: 'BBDC4', name: 'Banco Bradesco S.A.', basePrice: 15.95 },
      
      // Forex pairs
      { symbol: 'EURUSD', name: 'Euro / US Dollar', basePrice: 1.0850 },
      { symbol: 'GBPUSD', name: 'British Pound / US Dollar', basePrice: 1.2650 },
      { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', basePrice: 149.80 },
      { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', basePrice: 1.3580 },
      { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', basePrice: 0.6720 },
      
      // Cryptocurrencies
      { symbol: 'BTCUSDT', name: 'Bitcoin', basePrice: 43250.00 },
      { symbol: 'ETHUSDT', name: 'Ethereum', basePrice: 2450.00 },
      
      // Commodities
      { symbol: 'XAUUSD', name: 'Gold / US Dollar', basePrice: 2050.00 },
      { symbol: 'WTIUSD', name: 'WTI Crude Oil', basePrice: 78.50 }
    ];

    for (const asset of mockAssets) {
      try {
        // Gerar dados de candlestick históricos
        const candlesticks = this.generateCandlestickData(asset.symbol, asset.basePrice);
        
        for (const candle of candlesticks) {
          await storage.createCandlestickData(candle);
        }

        // Gerar dados de mercado atuais baseados no último candlestick
        const lastCandle = candlesticks[candlesticks.length - 1];
        const currentPrice = parseFloat(lastCandle.close);
        const previousClose = candlesticks.length > 1 ? parseFloat(candlesticks[candlesticks.length - 2].close) : currentPrice;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        const marketData: InsertMarketData = {
          symbol: asset.symbol,
          price: currentPrice.toFixed(2),
          previousClose: previousClose.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          volume: lastCandle.volume,
          high: lastCandle.high,
          low: lastCandle.low,
          open: lastCandle.open
        };

        await storage.createMarketData(marketData);
        
        console.log(`Mock data initialized for ${asset.symbol}`);
      } catch (error) {
        console.error(`Error initializing mock data for ${asset.symbol}:`, error);
      }
    }
  }

  async updateMockPrices(): Promise<void> {
    const assets = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BTCUSDT', 'ETHUSDT'];
    
    for (const symbol of assets) {
      try {
        const existingData = await storage.getMarketData(symbol);
        if (!existingData) continue;

        const currentPrice = parseFloat(existingData.price);
        const newPrice = this.generateRealisticPrice(currentPrice, 0.01);
        const previousClose = parseFloat(existingData.previousClose || existingData.price);
        const change = newPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        const updatedData: Partial<InsertMarketData> = {
          price: newPrice.toFixed(2),
          change: change.toFixed(2),
          changePercent: changePercent.toFixed(2),
          volume: Math.floor(Math.random() * 5000000) + 2000000
        };

        await storage.updateMarketData(symbol, updatedData);
      } catch (error) {
        console.error(`Error updating mock price for ${symbol}:`, error);
      }
    }
  }

  startPriceUpdates(): void {
    // Atualizar preços a cada 30 segundos para simular mercado em tempo real
    setInterval(() => {
      this.updateMockPrices();
    }, 30000);
  }
}

export const mockDataService = new MockDataService();