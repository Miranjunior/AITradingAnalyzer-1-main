import React from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useWatchlist, useMarketStatus } from '@/hooks/useAIAnalysis';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WatchlistSidebarProps {
  selectedSymbol: string;
  onSymbolSelect: (symbol: string) => void;
}

const WatchlistSidebar: React.FC<WatchlistSidebarProps> = ({
  selectedSymbol,
  onSymbolSelect,
}) => {
  const { data: watchlist = [], isLoading: watchlistLoading } = useWatchlist();
  const { data: marketStatus } = useMarketStatus();

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  const formatPercentage = (percent: string) => {
    const num = parseFloat(percent);
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getChangeColor = (changePercent: string) => {
    const num = parseFloat(changePercent);
    if (num > 0) return 'text-bullish';
    if (num < 0) return 'text-bearish';
    return 'text-slate-400';
  };

  const getTrendIcon = (changePercent: string) => {
    const num = parseFloat(changePercent);
    if (num > 0) return <TrendingUp className="h-3 w-3" />;
    if (num < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'text-bullish';
      case 'BEARISH': return 'text-bearish';
      default: return 'text-cyan-400';
    }
  };

  const getSentimentText = (sentiment?: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'Alta';
      case 'BEARISH': return 'Baixa';
      default: return 'Lateral';
    }
  };

  return (
    <div className="w-80 bg-navy-800/50 border-r border-navy-700 flex flex-col">
      <div className="p-4 border-b border-navy-700">
        <h2 className="text-lg font-semibold text-white mb-4">Lista de Acompanhamento</h2>
        
        {/* Market Status */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-400">Status do Mercado</span>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full relative ${
              marketStatus?.isOpen ? 'bg-bullish' : 'bg-bearish'
            }`}>
              {marketStatus?.isOpen && (
                <div className="absolute inset-0 w-2 h-2 bg-bullish rounded-full animate-ping" />
              )}
            </div>
            <span className={`text-sm font-medium ${
              marketStatus?.isOpen ? 'text-bullish' : 'text-bearish'
            }`}>
              {marketStatus?.isOpen ? 'Aberto' : 'Fechado'}
            </span>
          </div>
        </div>

        {/* Market Indices */}
        <div className="space-y-2 mb-4">
          <Card className="flex justify-between items-center p-2 bg-navy-700/50 border-navy-600">
            <span className="text-sm font-medium text-white">IBOV</span>
            <div className="text-right">
              <div className="text-sm font-mono text-white">128,847</div>
              <div className="text-xs text-bullish">+1.23%</div>
            </div>
          </Card>
          <Card className="flex justify-between items-center p-2 bg-navy-700/50 border-navy-600">
            <span className="text-sm font-medium text-white">S&P500</span>
            <div className="text-right">
              <div className="text-sm font-mono text-white">4,327.78</div>
              <div className="text-xs text-bearish">-0.45%</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Watchlist Items */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {watchlistLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhum ativo na lista</p>
          </div>
        ) : (
          <div className="space-y-2">
            {watchlist.map((item) => {
              const isSelected = item.symbol === selectedSymbol;
              const changePercent = item.marketData.changePercent || '0';
              const change = parseFloat(changePercent);
              
              return (
                <Card
                  key={item.symbol}
                  className={`p-3 cursor-pointer transition-all hover:bg-navy-700/50 border-l-2 ${
                    isSelected ? 'bg-navy-700/50 border-l-blue-500' : 
                    change > 0 ? 'border-l-bullish' : 
                    change < 0 ? 'border-l-bearish' : 'border-l-cyan-400'
                  } ${isSelected ? 'ring-1 ring-blue-500/50' : ''}`}
                  onClick={() => onSymbolSelect(item.symbol)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{item.symbol}</h3>
                      <p className="text-xs text-slate-400 truncate max-w-[120px]">
                        {item.symbol === 'PETR4' && 'Petrobras ON'}
                        {item.symbol === 'VALE3' && 'Vale ON'}
                        {item.symbol === 'ITUB4' && 'Itaú Unibanco PN'}
                        {item.symbol === 'BTCUSDT' && 'Bitcoin'}
                        {!['PETR4', 'VALE3', 'ITUB4', 'BTCUSDT'].includes(item.symbol) && 'Ativo'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-white">
                        {formatPrice(item.marketData.price)}
                      </div>
                      <div className={`text-xs ${getChangeColor(changePercent)}`}>
                        {formatPercentage(changePercent)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-xs text-slate-400">
                    <span>
                      Vol: {item.marketData.volume ? 
                        (item.marketData.volume / 1000000).toFixed(1) + 'M' : 
                        'N/A'
                      }
                    </span>
                    <div className={`flex items-center space-x-1 ${
                      getSentimentColor(item.analysis?.sentiment)
                    }`}>
                      {getTrendIcon(changePercent)}
                      <span>{getSentimentText(item.analysis?.sentiment)}</span>
                    </div>
                  </div>
                  
                  {/* AI Analysis Badge */}
                  {item.analysis && (
                    <div className="mt-2 flex items-center justify-between">
                      <Badge 
                        variant={
                          item.analysis.recommendation === 'BUY' ? 'default' :
                          item.analysis.recommendation === 'SELL' ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {item.analysis.recommendation === 'BUY' ? 'COMPRA' :
                         item.analysis.recommendation === 'SELL' ? 'VENDA' : 'ESPERA'}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {item.analysis.confidence}% conf.
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchlistSidebar;
