import { CandlestickData, TechnicalIndicators } from '../../shared/types/trading';

export class TechnicalIndicatorsService {
  calculateIndicators(candlesticks: CandlestickData[]): TechnicalIndicators {
    if (candlesticks.length < 200) {
      throw new Error('Dados insuficientes para cálculo de indicadores');
    }

    const prices = candlesticks.map(c => parseFloat(c.close));
    const volumes = candlesticks.map(c => c.volume);

    return {
      symbol: candlesticks[0].symbol,
      timeframe: candlesticks[0].timeframe,
      rsi: this.calculateRSI(prices, 14).toString(),
      macd: this.calculateMACD(prices).macd.toString(),
      macdSignal: this.calculateMACD(prices).signal.toString(),
      macdHistogram: this.calculateMACD(prices).histogram.toString(),
      sma20: this.calculateSMA(prices, 20).toString(),
      sma50: this.calculateSMA(prices, 50).toString(),
      ema20: this.calculateEMA(prices, 20).toString(),
      ema50: this.calculateEMA(prices, 50).toString(),
      bollingerUpper: this.calculateBollingerBands(prices).upper.toString(),
      bollingerMiddle: this.calculateBollingerBands(prices).middle.toString(),
      bollingerLower: this.calculateBollingerBands(prices).lower.toString(),
      stochastic: this.calculateStochastic(candlesticks).toString(),
      williamsR: this.calculateWilliamsR(candlesticks).toString(),
      adx: this.calculateADX(candlesticks).toString(),
      updatedAt: new Date(),
    };
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    let gains = 0;
    let losses = 0;

    // Calcular ganhos e perdas iniciais
    for (let i = 1; i < period; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    // Calcular médias iniciais
    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calcular RSI usando média móvel suavizada
    for (let i = period; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      
      if (difference >= 0) {
        avgGain = ((avgGain * (period - 1)) + difference) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = ((avgLoss * (period - 1)) - difference) / period;
      }
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA([macdLine], 9);
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateEMA(prices: number[], period: number): number {
    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateBollingerBands(prices: number[]): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const period = 20;
    const stdDevMultiplier = 2;

    const sma = this.calculateSMA(prices, period);
    
    // Calcular desvio padrão
    const squaredDifferences = prices
      .slice(-period)
      .map(price => Math.pow(price - sma, 2));
    
    const standardDeviation = Math.sqrt(
      squaredDifferences.reduce((a, b) => a + b, 0) / period
    );

    return {
      upper: sma + (standardDeviation * stdDevMultiplier),
      middle: sma,
      lower: sma - (standardDeviation * stdDevMultiplier)
    };
  }

  private calculateStochastic(candlesticks: CandlestickData[]): number {
    const period = 14;
    const recent = candlesticks.slice(-period);
    
    const currentClose = parseFloat(recent[recent.length - 1].close);
    const lowestLow = Math.min(...recent.map(c => parseFloat(c.low)));
    const highestHigh = Math.max(...recent.map(c => parseFloat(c.high)));
    
    return ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  }

  private calculateWilliamsR(candlesticks: CandlestickData[]): number {
    const period = 14;
    const recent = candlesticks.slice(-period);
    
    const currentClose = parseFloat(recent[recent.length - 1].close);
    const highestHigh = Math.max(...recent.map(c => parseFloat(c.high)));
    const lowestLow = Math.min(...recent.map(c => parseFloat(c.low)));
    
    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  }

  private calculateADX(candlesticks: CandlestickData[]): number {
    const period = 14;
    const smoothingPeriod = 14;
    const trueRanges: number[] = [];
    const dmPos: number[] = [];
    const dmNeg: number[] = [];

    // Calcular TR e DM
    for (let i = 1; i < candlesticks.length; i++) {
      const current = candlesticks[i];
      const prev = candlesticks[i - 1];
      
      const high = parseFloat(current.high);
      const low = parseFloat(current.low);
      const prevClose = parseFloat(prev.close);
      
      // True Range
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
      
      // Directional Movement
      const upMove = high - parseFloat(prev.high);
      const downMove = parseFloat(prev.low) - low;
      
      if (upMove > downMove && upMove > 0) {
        dmPos.push(upMove);
        dmNeg.push(0);
      } else if (downMove > upMove && downMove > 0) {
        dmPos.push(0);
        dmNeg.push(downMove);
      } else {
        dmPos.push(0);
        dmNeg.push(0);
      }
    }

    // Calcular médias suavizadas
    const atr = this.calculateWilder(trueRanges, period);
    const plusDI = (this.calculateWilder(dmPos, period) / atr) * 100;
    const minusDI = (this.calculateWilder(dmNeg, period) / atr) * 100;
    
    // Calcular ADX
    const dx = Math.abs((plusDI - minusDI) / (plusDI + minusDI)) * 100;
    return this.calculateWilder([dx], smoothingPeriod);
  }

  private calculateOBV(prices: number[], volumes: number[]): number {
    let obv = 0;
    
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
    }
    
    return obv;
  }

  private calculateMomentum(prices: number[], period: number): number {
    return prices[prices.length - 1] - prices[prices.length - period];
  }

  private calculateROC(prices: number[], period: number): number {
    const currentPrice = prices[prices.length - 1];
    const oldPrice = prices[prices.length - period];
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  }

  private calculateWilder(values: number[], period: number): number {
    let sum = values.slice(0, period).reduce((a, b) => a + b, 0);
    let wilder = sum;
    
    for (let i = period; i < values.length; i++) {
      wilder = (wilder * (period - 1) + values[i]) / period;
    }
    
    return wilder;
  }
}

export const indicators = new TechnicalIndicatorsService();
