import { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { AdvancedTradingChart } from './AdvancedTradingChart';
import { RiskManagementPanel } from './RiskManagementPanel';
import { TechnicalIndicators } from './TechnicalIndicators';
import { MarketSentiment } from './MarketSentiment';

export function MarketAnalysisDashboard() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [timeframe, setTimeframe] = useState('1h');

  const { data: marketData } = useMarketData(selectedSymbol);
  const { data: analysis } = useAIAnalysis(selectedSymbol, timeframe);

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      <div className="col-span-8">
        <AdvancedTradingChart 
          symbol={selectedSymbol}
          data={marketData?.candles}
          indicators={analysis?.technicalIndicators}
        />
      </div>

      <div className="col-span-4 space-y-4">
        <RiskManagementPanel />
        <TechnicalIndicators data={analysis?.technicalIndicators} />
        <MarketSentiment 
          sentiment={analysis?.marketSentiment}
          newsImpact={analysis?.newsImpact}
        />
      </div>
    </div>
  );
}
