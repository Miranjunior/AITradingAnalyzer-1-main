import { useQuery } from '@tanstack/react-query';
import { MarketData } from '../types/trading';

export function useMarketData(symbol: string | undefined) {
  return useQuery<MarketData>({
    queryKey: ['marketData', symbol],
    queryFn: async () => {
      if (!symbol) throw new Error('Symbol is required');
      
      const response = await fetch(`/api/market-data?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      
      return response.json();
    },
    enabled: !!symbol,
    refetchInterval: 5000, // Atualiza a cada 5 segundos
    staleTime: 2000, // Considera dados frescos por 2 segundos
    retry: 3
  });
}
