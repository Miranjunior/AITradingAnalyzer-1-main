export interface RiskParameters {
  accountBalance: number;
  riskPercentage: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  leverage?: number;
  symbol: string;
}

export interface RiskMetrics {
  riskRewardRatio: number;
  accountExposure: number;
  maxLoss: number;
  potentialProfit: number;
  marginRequirement?: number;
  leverageEffect?: number;
}

export interface PositionSize {
  units: number;
  value: number;
  maxLeverage: number;
  recommendedLeverage: number;
  marginRequired: number;
}

export interface RiskAnalysis {
  recommendation: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxPositionSize: number;
  suggestedStopLoss: number;
  leverageWarning?: string;
  volatilityMetrics?: {
    dailyVolatility: number;
    averageRange: number;
    expectedMove: number;
  };
}
