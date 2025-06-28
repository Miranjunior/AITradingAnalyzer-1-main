import { useState } from 'react';
import { AdvancedTradingChart } from './AdvancedTradingChart';
import { AIAnalysisPanel } from './AIAnalysisPanel';
import { TradingControls } from './TradingControls';
import { WatchlistSidebar } from './WatchlistSidebar';
import { AlertsPanel } from './AlertsPanel';
import { useMarketData } from '../hooks/useMarketData';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { Asset, TimeFrame } from '../types/trading';

export function TradingDashboard() {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeFrame>('1h');
  const [showAlerts, setShowAlerts] = useState(false);

  const { data: marketData, isLoading: isLoadingMarket } = useMarketData(
    selectedAsset?.symbol
  );

  const { data: analysis, isLoading: isLoadingAnalysis } = useAIAnalysis(
    selectedAsset?.symbol,
    selectedTimeframe
  );

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleTimeframeChange = (timeframe: TimeFrame) => {
    setSelectedTimeframe(timeframe);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar esquerda - Watchlist */}
      <WatchlistSidebar
        selectedAsset={selectedAsset}
        onAssetSelect={handleAssetSelect}
        className="w-64 border-r border-gray-800"
      />

      {/* Área principal */}
      <div className="flex-1 flex flex-col">
        {/* Controles superiores */}
        <TradingControls
          selectedAsset={selectedAsset}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={handleTimeframeChange}
          onToggleAlerts={() => setShowAlerts(!showAlerts)}
          className="p-4 border-b border-gray-800"
        />

        {/* Área do gráfico */}
        <div className="flex-1 relative">
          {selectedAsset ? (
            <AdvancedTradingChart
              symbol={selectedAsset.symbol}
              timeframe={selectedTimeframe}
              darkMode={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Selecione um ativo para começar</p>
            </div>
          )}
        </div>

        {/* Painel de análise IA */}
        <AIAnalysisPanel
          analysis={analysis}
          isLoading={isLoadingAnalysis}
          className="h-64 border-t border-gray-800"
        />
      </div>

      {/* Sidebar direita - Alertas */}
      {showAlerts && (
        <AlertsPanel
          symbol={selectedAsset?.symbol}
          onClose={() => setShowAlerts(false)}
          className="w-72 border-l border-gray-800"
        />
      )}
    </div>
  );
}
