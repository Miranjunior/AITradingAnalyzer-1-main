import { useState, useEffect } from 'react';
import { useRiskManagement } from '../hooks/useRiskManagement';
import { RiskParameters, RiskMetrics, RiskAnalysis } from '../types/riskManagement';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Alert } from './ui/alert';

export function RiskManagementPanel() {
  const [riskParams, setRiskParams] = useState<RiskParameters>({
    accountBalance: 0,
    riskPercentage: 1,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    symbol: '',
    leverage: 1,
  });

  const { calculateRiskReward, getRiskAnalysis } = useRiskManagement();
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);

  useEffect(() => {
    const updateRiskMetrics = async () => {
      if (!riskParams.entryPrice || !riskParams.stopLoss) return;

      try {
        const [metricsResult, analysisResult] = await Promise.all([
          calculateRiskReward.mutateAsync(riskParams),
          getRiskAnalysis.mutateAsync(riskParams)
        ]);

        setMetrics(metricsResult);
        setAnalysis(analysisResult);
      } catch (error) {
        console.error('Erro ao calcular métricas de risco:', error);
      }
    };

    updateRiskMetrics();
  }, [riskParams]);

  return (
    <Card className="p-4 space-y-6">
      <h3 className="text-xl font-semibold">Gerenciamento de Risco</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Risco/Retorno</label>
          <div className="mt-1">
            <Progress value={metrics?.riskRewardRatio ?? 0} max={3} />
            <span className="text-sm">{metrics?.riskRewardRatio?.toFixed(2)}:1</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Exposição da Conta</label>
          <div className="mt-1">
            <Progress 
              value={metrics?.accountExposure ?? 0} 
              max={100}
              variant={
                (metrics?.accountExposure ?? 0) > 5 ? 'danger' : 'success'
              }
            />
            <span className="text-sm">{metrics?.accountExposure?.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {analysis && (
        <Alert variant={analysis.riskLevel}>
          <h4 className="font-medium">Recomendação</h4>
          <p className="text-sm">{analysis.recommendation}</p>
          {analysis.leverageWarning && (
            <p className="text-sm text-yellow-500 mt-2">{analysis.leverageWarning}</p>
          )}
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-red-500">Perda Máxima</label>
          <span className="text-xl font-bold text-red-500">
            ${metrics?.maxLoss?.toFixed(2)}
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-green-500">Ganho Potencial</label>
          <span className="text-xl font-bold text-green-500">
            ${metrics?.potentialProfit?.toFixed(2)}
          </span>
        </div>
      </div>

      {analysis?.volatilityMetrics && (
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Métricas de Volatilidade</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block">Volatilidade Diária</label>
              <span>{analysis.volatilityMetrics.dailyVolatility.toFixed(2)}%</span>
            </div>
            <div>
              <label className="block">Range Médio</label>
              <span>${analysis.volatilityMetrics.averageRange.toFixed(2)}</span>
            </div>
            <div>
              <label className="block">Movimento Esperado</label>
              <span>${analysis.volatilityMetrics.expectedMove.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
