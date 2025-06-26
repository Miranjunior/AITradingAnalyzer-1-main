import { useQuery } from "@tanstack/react-query";
import { AIAnalysis, WatchlistItem, MarketStatus, Timeframe } from "@/types/trading";

export function useAIAnalysis(symbol: string, timeframe: Timeframe) {
  return useQuery<AIAnalysis>({
    queryKey: ['/api/analysis', symbol, timeframe],
    enabled: !!symbol && !!timeframe,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    staleTime: 8 * 60 * 1000, // Consider data stale after 8 minutes
  });
}

export function useWatchlist() {
  return useQuery<WatchlistItem[]>({
    queryKey: ['/api/watchlist'],
    refetchInterval: 60000, // Refetch every minute
    staleTime: 50000,
  });
}

export function useMarketStatus() {
  return useQuery<MarketStatus>({
    queryKey: ['/api/market-status'],
    refetchInterval: 60000, // Check every minute
    staleTime: 50000,
  });
}
