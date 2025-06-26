import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MarketData, TechnicalIndicators, CandlestickData, Timeframe } from "@/types/trading";

export function useMarketData(symbol: string) {
  return useQuery<MarketData>({
    queryKey: ['/api/market-data', symbol],
    enabled: !!symbol,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000, // Consider data stale after 25 seconds
  });
}

export function useAllMarketData() {
  return useQuery<MarketData[]>({
    queryKey: ['/api/market-data'],
    refetchInterval: 30000,
    staleTime: 25000,
  });
}

export function useTechnicalIndicators(symbol: string, timeframe: Timeframe) {
  return useQuery<TechnicalIndicators>({
    queryKey: ['/api/indicators', symbol, timeframe],
    enabled: !!symbol && !!timeframe,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 4 * 60 * 1000, // Consider data stale after 4 minutes
  });
}

export function useCandlestickData(symbol: string, timeframe: Timeframe, limit = 100) {
  return useQuery<CandlestickData[]>({
    queryKey: ['/api/candlesticks', symbol, timeframe, limit],
    enabled: !!symbol && !!timeframe,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 50000, // Consider data stale after 50 seconds
  });
}

export function useRefreshData() {
  const queryClient = useQueryClient();

  const refreshSymbol = async (symbol: string, timeframe: Timeframe = '1d') => {
    try {
      const response = await fetch(`/api/refresh/${symbol}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeframe }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh data');
      }

      // Invalidate related queries
      await queryClient.invalidateQueries({ queryKey: ['/api/market-data', symbol] });
      await queryClient.invalidateQueries({ queryKey: ['/api/indicators', symbol] });
      await queryClient.invalidateQueries({ queryKey: ['/api/analysis', symbol] });
      await queryClient.invalidateQueries({ queryKey: ['/api/candlesticks', symbol] });

      return await response.json();
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  };

  return { refreshSymbol };
}
