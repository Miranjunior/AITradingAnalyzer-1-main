import React, { useState } from 'react';
import NavigationHeader from '@/components/NavigationHeader';
import WatchlistSidebar from '@/components/WatchlistSidebar';
import ChartArea from '@/components/ChartArea';
import AnalysisSidebar from '@/components/AnalysisSidebar';
import { Timeframe } from '@/types/trading';

const Dashboard: React.FC = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('PETR4');
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');

  const handleAssetSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-900 to-navy-800">
      {/* Navigation Header */}
      <NavigationHeader 
        onAssetSelect={handleAssetSelect}
        selectedSymbol={selectedSymbol}
      />

      {/* Main Content Layout */}
      <div className="flex h-screen pt-16">
        {/* Left Sidebar - Watchlist */}
        <WatchlistSidebar 
          selectedSymbol={selectedSymbol}
          onSymbolSelect={handleSymbolSelect}
        />

        {/* Main Chart Area */}
        <ChartArea selectedSymbol={selectedSymbol} />

        {/* Right Sidebar - Analysis & Indicators */}
        <AnalysisSidebar 
          selectedSymbol={selectedSymbol}
          timeframe={timeframe}
        />
      </div>
    </div>
  );
};

export default Dashboard;
