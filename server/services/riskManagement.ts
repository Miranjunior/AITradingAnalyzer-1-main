export class RiskManagementService {
  calculatePositionSize(params: {
    accountBalance: number;
    riskPercentage: number;
    entryPrice: number;
    stopLoss: number;
    leverage?: number;
  }): {
    size: number;
    value: number;
    riskAmount: number;
    riskPerUnit: number;
    leverage: number;
  } {
    const { 
      accountBalance,
      riskPercentage,
      entryPrice,
      stopLoss,
      leverage = 1
    } = params;
    
    // Calcular risco por unidade
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    
    // Calcular risco máximo em moeda
    const maxRiskAmount = (accountBalance * (riskPercentage / 100));
    
    // Calcular tamanho da posição
    const positionSize = (maxRiskAmount / riskPerUnit) * leverage;
    
    // Calcular valor total da posição
    const positionValue = positionSize * entryPrice;
    
    return {
      size: positionSize,
      value: positionValue,
      riskAmount: maxRiskAmount,
      riskPerUnit,
      leverage
    };
  }

  calculateRiskMetrics(setup: {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    confidence: number;
    accountBalance: number;
  }): {
    risk: number;
    reward: number;
    riskRewardRatio: number;
    winRate: number;
    expectancy: number;
    maxDrawdown: number;
    kelly: number;
  } {
    const { 
      entryPrice,
      stopLoss,
      takeProfit,
      positionSize
    } = setup;
    
    // Calcular risco/retorno
    const risk = Math.abs(entryPrice - stopLoss) * positionSize;
    const reward = Math.abs(takeProfit - entryPrice) * positionSize;
    const riskRewardRatio = reward / risk;
    
    // Calcular expectativa matemática
    const winRate = setup.confidence / 100;
    const expectancy = (winRate * reward) - ((1 - winRate) * risk);
    
    // Calcular drawdown máximo potencial
    const maxDrawdown = (risk / setup.accountBalance) * 100;
    
    return {
      risk,
      reward,
      riskRewardRatio,
      winRate,
      expectancy,
      maxDrawdown,
      kelly: this.calculateKellyCriterion(winRate, riskRewardRatio)
    };
  }

  private calculateKellyCriterion(winRate: number, riskRewardRatio: number): number {
    return ((winRate * (1 + riskRewardRatio)) - 1) / riskRewardRatio;
  }

  validateTradeSetup(setup: {
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    confidence: number;
    accountBalance: number;
  }): {
    isValid: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    
    // Validar parâmetros básicos
    if (!setup.entryPrice || !setup.stopLoss || !setup.takeProfit) {
      reasons.push('Preços de entrada, stop loss ou take profit faltando');
    }
    
    // Validar risco/retorno
    const metrics = this.calculateRiskMetrics(setup);
    if (metrics.riskRewardRatio < 1.5) {
      reasons.push('Relação risco/retorno abaixo do mínimo (1.5)');
    }
    
    // Validar risco por trade
    const riskPercentage = (metrics.risk / setup.accountBalance) * 100;
    if (riskPercentage > 2) {
      reasons.push('Risco por trade acima do máximo (2%)');
    }
    
    // Validar expectativa
    if (metrics.expectancy <= 0) {
      reasons.push('Expectativa matemática negativa');
    }
    
    return {
      isValid: reasons.length === 0,
      reasons
    };
  }

  calculateCompoundedReturns(params: {
    initialBalance: number;
    winRate: number;
    riskRewardRatio: number;
    riskPerTrade: number;
    numberOfTrades: number;
  }): {
    finalBalance: number;
    returns: number;
    trades: Array<{
      tradeNumber: number;
      balance: number;
      result: 'win' | 'loss';
      change: number;
    }>;
  } {
    const {
      initialBalance,
      winRate,
      riskRewardRatio,
      riskPerTrade,
      numberOfTrades
    } = params;
    
    let currentBalance = initialBalance;
    const trades = [];
    
    for (let i = 1; i <= numberOfTrades; i++) {
      const isWin = Math.random() < winRate;
      const riskAmount = currentBalance * (riskPerTrade / 100);
      const changeAmount = isWin ? 
        riskAmount * riskRewardRatio : 
        -riskAmount;
      
      currentBalance += changeAmount;
      
      trades.push({
        tradeNumber: i,
        balance: currentBalance,
        result: isWin ? ('win' as 'win') : ('loss' as 'loss'),
        change: changeAmount
      });
    }
    
    return {
      finalBalance: currentBalance,
      returns: ((currentBalance - initialBalance) / initialBalance) * 100,
      trades
    };
  }
}

export const riskManagement = new RiskManagementService();
