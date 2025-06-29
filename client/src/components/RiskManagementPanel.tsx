import { useState, useEffect } from 'react';
import { useRiskManagement } from '../hooks/useRiskManagement';
import { RiskParameters, RiskMetrics, RiskAnalysis } from '@/types/riskManagement';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Alert } from './ui/alert';

export function RiskManagementPanel() {
  // Ajustar para os campos válidos de RiskParameters
  const [riskParams, setRiskParams] = useState<RiskParameters>({
    accountSize: 0,
    riskPerTrade: 1,
    maxDrawdown: 0,
    stopLoss: 0,
    takeProfit: 0,
  });

  const { calculateRiskReward, getRiskAnalysis } = useRiskManagement();
  const [metrics, setMetrics] = useState<RiskMetrics | null>(null);
  const [analysis, setAnalysis] = useState<RiskAnalysis | null>(null);

  useEffect(() => {
    const updateRiskMetrics = async () => {
      if (!riskParams.stopLoss || !riskParams.takeProfit) return;
      try {
        const [metricsResult, analysisResult] = await Promise.all([
          calculateRiskReward.mutateAsync(riskParams),
          getRiskAnalysis.mutateAsync(riskParams)
        ]);
        setMetrics(metricsResult);
        // Adaptar o resultado para RiskAnalysis
        setAnalysis({
          riskLevel: (analysisResult.riskLevel?.toUpperCase?.() ?? 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
          maxLoss: 0,
          recommendedLeverage: 1,
          riskMetrics: metricsResult,
          warnings: [],
          suggestions: [],
        });
      } catch (error) {
        console.error('Erro ao calcular métricas de risco:', error);
      }
    };
    updateRiskMetrics();
  }, [riskParams]);

  // Função para mapear riskLevel para variant do Alert
  const getAlertVariant = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): 'default' | 'destructive' => {
    if (riskLevel === 'HIGH') return 'destructive';
    return 'default';
  };

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
          <label className="block text-sm font-medium">Tamanho da Posição</label>
          <div className="mt-1">
            <span className="text-sm">{metrics?.positionSize ?? 0}</span>
          </div>
        </div>
      </div>
      {analysis && (
        <Alert variant={getAlertVariant(analysis.riskLevel)}>
          <h4 className="font-medium">Nível de Risco: {analysis.riskLevel}</h4>
          <ul className="text-sm list-disc ml-4">
            {analysis.warnings.map((w: string, i: number) => (
              <li key={i} className="text-yellow-500">{w}</li>
            ))}
            {analysis.suggestions.map((s: string, i: number) => (
              <li key={i} className="text-green-500">{s}</li>
            ))}
          </ul>
        </Alert>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-red-500">Perda Potencial</label>
          <span className="text-xl font-bold text-red-500">
            ${metrics?.potentialLoss?.toFixed(2)}
          </span>
        </div>
        <div>
          <label className="block text-sm font-medium text-green-500">Ganho Potencial</label>
          <span className="text-xl font-bold text-green-500">
            ${metrics?.potentialGain?.toFixed(2)}
          </span>
        </div>
      </div>
    </Card>
  );
}
