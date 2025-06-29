import { useQuery } from '@tanstack/react-query';
import { TechnicalIndicators, Timeframe } from '../types/trading';

export function useTechnicalIndicators(
  symbol: string | undefined,
  timeframe: Timeframe
) {
  return useQuery<TechnicalIndicators>({
    queryKey: ['technicalIndicators', symbol, timeframe],
    queryFn: async () => {
      if (!symbol) throw new Error('Symbol is required');
      
      const response = await fetch(
        `/api/indicators?symbol=${symbol}&timeframe=${timeframe}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch technical indicators');
      }
      
      return response.json();
    },
    enabled: !!symbol,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 15000, // Considera dados frescos por 15 segundos
  });
}
