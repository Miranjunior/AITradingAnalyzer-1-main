import { useMutation } from '@tanstack/react-query';
import { RiskParameters, PositionSize, RiskMetrics } from '../types/trading';

export function useRiskManagement() {
  const calculatePositionSize = useMutation({
    mutationFn: async (params: RiskParameters): Promise<PositionSize> => {
      const response = await fetch('/api/risk/position-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao calcular tamanho da posição');
      }
      
      return response.json();
    },
  });

  const calculateRiskReward = useMutation({
    mutationFn: async (params: RiskParameters): Promise<RiskMetrics> => {
      const response = await fetch('/api/risk/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao calcular métricas de risco');
      }
      
      return response.json();
    },
  });

  const getRiskAnalysis = useMutation({
    mutationFn: async (params: RiskParameters): Promise<{
      recommendation: string;
      riskLevel: 'low' | 'medium' | 'high';
      maxPositionSize: number;
      suggestedStopLoss: number;
    }> => {
      const response = await fetch('/api/risk/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao obter análise de risco');
      }
      
      return response.json();
    },
  });

  return {
    calculatePositionSize,
    calculateRiskReward,
    getRiskAnalysis,
  };
}
