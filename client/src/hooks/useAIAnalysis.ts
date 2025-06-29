import { useQuery } from '@tanstack/react-query';
import { AIAnalysis, Timeframe } from '../types/trading';

export function useAIAnalysis(symbol: string | undefined, timeframe: Timeframe) {
  return useQuery<AIAnalysis>({
    queryKey: ['aiAnalysis', symbol, timeframe],
    queryFn: async () => {
      if (!symbol) throw new Error('Symbol is required');
      
      const response = await fetch(`/api/analysis?symbol=${symbol}&timeframe=${timeframe}`);
      if (!response.ok) {
        throw new Error('Failed to fetch AI analysis');
      }
      
      return response.json();
    },
    enabled: !!symbol,
    refetchInterval: 60000, // Atualiza a cada minuto
    staleTime: 30000, // Considera dados frescos por 30 segundos
    retry: 2
  });
}
