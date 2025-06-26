import React, { useState } from 'react';
import { useCandlestickData } from '@/hooks/useMarketData';
import { useMarketData } from '@/hooks/useMarketData';
import { ChartType, Timeframe } from '@/types/trading';
import TradingChart from './TradingChart';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRefreshData } from '@/hooks/useMarketData';
import { useToast } from '@/hooks/use-toast';

interface ChartAreaProps {
  selectedSymbol: string;
}

const ChartArea: React.FC<ChartAreaProps> = ({ selectedSymbol }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1d');
  const [chartType, setChartType] = useState<ChartType>('line');
  const { toast } = useToast();
  const { refreshSymbol } = useRefreshData();

  const { data: marketData, isLoading: marketDataLoading } = useMarketData(selectedSymbol);
  const { data: candlestickData = [], isLoading: chartLoading } = useCandlestickData(
    selectedSymbol,
    timeframe,
    100
  );

  const handleRefresh = async () => {
    try {
      await refreshSymbol(selectedSymbol, timeframe);
      toast({
        title: "Gráfico atualizado",
        description: `Dados de ${selectedSymbol} foram atualizados em tempo real.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const formatChange = (change: string, changePercent: string) => {
    const changeNum = parseFloat(change);
    const percentNum = parseFloat(changePercent);
    const sign = changeNum >= 0 ? '+' : '';
    return `${sign}${percentNum.toFixed(2)}% (${sign}${changeNum.toFixed(2)})`;
  };

  const getChangeColor = (changePercent: string) => {
    const num = parseFloat(changePercent);
    if (num > 0) return 'text-bullish bg-bullish/20';
    if (num < 0) return 'text-bearish bg-bearish/20';
    return 'text-slate-400 bg-slate-400/20';
  };

  const getAssetName = (symbol: string) => {
    const names: Record<string, string> = {
      'PETR4': 'Petrobras Petróleo Brasil S.A.',
      'VALE3': 'Vale S.A.',
      'ITUB4': 'Itaú Unibanco Holding S.A.',
      'BBDC4': 'Banco Bradesco S.A.',
      'BTCUSDT': 'Bitcoin',
      'ETHUSDT': 'Ethereum',
    };
    return names[symbol] || symbol;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chart Header Controls */}
      <div className="bg-navy-800/50 border-b border-navy-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{selectedSymbol}</h1>
              <p className="text-sm text-slate-400">{getAssetName(selectedSymbol)}</p>
            </div>
            
            {marketData && (
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold font-mono text-white">
                  {formatPrice(marketData.price)}
                </span>
                {marketData.changePercent && marketData.change && (
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    getChangeColor(marketData.changePercent)
                  }`}>
                    {formatChange(marketData.change, marketData.changePercent)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex-1 p-4">
        <div className="h-full bg-gradient-to-br from-navy-800/50 to-navy-700/30 rounded-xl p-4">
          <TradingChart
            data={candlestickData}
            symbol={selectedSymbol}
            timeframe={timeframe}
            chartType={chartType}
            isLoading={chartLoading || marketDataLoading}
            onTimeframeChange={setTimeframe}
            onChartTypeChange={setChartType}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartArea;
