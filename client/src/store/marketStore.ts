import { create } from 'zustand';
import { CandlestickData, MarketData } from '../types/trading';

interface MarketStore {
  marketData: Record<string, MarketData>;
  realtimeData: Record<string, {
    price: number;
    volume: number;
    change: number;
    timestamp: string;
  }>;
  updateMarketData: (symbol: string, data: MarketData) => void;
  updateRealtimeData: (symbol: string, data: any) => void;
  clearMarketData: (symbol: string) => void;
}

export const useMarketStore = create<MarketStore>((set) => ({
  marketData: {},
  realtimeData: {},

  updateMarketData: (symbol, data) =>
    set((state) => ({
      marketData: {
        ...state.marketData,
        [symbol]: data
      }
    })),

  updateRealtimeData: (symbol, data) =>
    set((state) => ({
      realtimeData: {
        ...state.realtimeData,
        [symbol]: {
          ...data,
          timestamp: new Date().toISOString()
        }
      }
    })),

  clearMarketData: (symbol) =>
    set((state) => {
      const { [symbol]: removed, ...rest } = state.marketData;
      const { [symbol]: removedRealtime, ...restRealtime } = state.realtimeData;
      return {
        marketData: rest,
        realtimeData: restRealtime
      };
    })
}));