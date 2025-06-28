import { useEffect, useState } from 'react';
import { useWatchlist } from '../hooks/useWatchlist';
import { useMarketData } from '../hooks/useMarketData';
import { Asset } from '../types/trading';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface WatchlistSidebarProps {
  selectedAsset: Asset | null;
  onAssetSelect: (asset: Asset) => void;
  className?: string;
}

export function WatchlistSidebar({
  selectedAsset,
  onAssetSelect,
  className = ''
}: WatchlistSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { watchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);

  useEffect(() => {
    const filtered = watchlist.filter(asset =>
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAssets(filtered);
  }, [searchTerm, watchlist]);

  return (
    <div className={`bg-gray-900 flex flex-col ${className}`}>
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Lista de Ativos</h2>
        <Input
          type="search"
          placeholder="Buscar ativos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {filteredAssets.map((asset) => (
            <WatchlistItem
              key={asset.symbol}
              asset={asset}
              isSelected={selectedAsset?.symbol === asset.symbol}
              onSelect={() => onAssetSelect(asset)}
              onRemove={() => removeFromWatchlist.mutate(asset.symbol)}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {/* Implementar modal de adicionar ativo */}}
        >
          Adicionar Ativo
        </Button>
      </div>
    </div>
  );
}

interface WatchlistItemProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function WatchlistItem({
  asset,
  isSelected,
  onSelect,
  onRemove
}: WatchlistItemProps) {
  const { data: marketData } = useMarketData(asset.symbol);
  
  const priceChange = marketData?.changePercent || 0;
  const isPositive = priceChange > 0;
  const isNegative = priceChange < 0;

  return (
    <Card
      className={`
        p-3 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-900/50' : 'bg-gray-800 hover:bg-gray-700'}
      `}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{asset.symbol}</span>
            <Badge className={`text-xs ${getMarketBadgeColor(asset.market)}`}>
              {asset.market}
            </Badge>
          </div>
          <p className="text-sm text-gray-400">{asset.name}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-gray-400 hover:text-red-400"
        >
          ✕
        </Button>
      </div>

      {marketData && (
        <div className="mt-2 flex justify-between items-center">
          <span className="text-lg">{formatPrice(marketData.price)}</span>
          <span className={`
            text-sm font-medium
            ${isPositive ? 'text-green-400' : ''}
            ${isNegative ? 'text-red-400' : ''}
            ${!isPositive && !isNegative ? 'text-gray-400' : ''}
          `}>
            {formatPercentage(priceChange)}
          </span>
        </div>
      )}
    </Card>
  );
}

function getMarketBadgeColor(market: string): string {
  switch (market.toUpperCase()) {
    case 'CRYPTO':
      return 'bg-purple-500';
    case 'FOREX':
      return 'bg-blue-500';
    case 'B3':
      return 'bg-green-500';
    case 'NYSE':
    case 'NASDAQ':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  }).format(price);
}

function formatPercentage(value: number): string {
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always'
  }).format(value);
  return `${formatted}%`;
}
