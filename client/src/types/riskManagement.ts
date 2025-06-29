export interface RiskParameters {
  accountSize: number;
  riskPerTrade: number;
  maxDrawdown: number;
  stopLoss: number;
  takeProfit: number;
}

export interface RiskMetrics {
  positionSize: number;
  potentialLoss: number;
  potentialGain: number;
  riskRewardRatio: number;
}

export interface RiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  maxLoss: number;
  recommendedLeverage: number;
  riskMetrics: RiskMetrics;
  warnings: string[];
  suggestions: string[];
}
