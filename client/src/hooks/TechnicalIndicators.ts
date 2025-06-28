import { useQuery } from '@tanstack/react-query';
import { TechnicalIndicators, TimeFrame } from '../types/trading';

export function useTechnicalIndicators(
  symbol: string | undefined,
  timeframe: TimeFrame
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
    select: (data) => ({
      ...data,
      rsi: Number(data.rsi),
      macd: Number(data.macd),
      macdSignal: Number(data.macdSignal),
      macdHistogram: Number(data.macdHistogram),
      ma20: Number(data.ma20),
      ma50: Number(data.ma50),
      ma200: Number(data.ma200),
      ema20: Number(data.ema20),
      ema50: Number(data.ema50),
      bollingerUpper: Number(data.bollingerUpper),
      bollingerMiddle: Number(data.bollingerMiddle),
      bollingerLower: Number(data.bollingerLower),
      stochastic: Number(data.stochastic),
      williamsR: Number(data.williamsR),
      adx: Number(data.adx)
    })
  });
}
