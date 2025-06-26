import React, { useState } from 'react';
import { Search, Bell, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { Asset } from '@/types/trading';

interface NavigationHeaderProps {
  onAssetSelect: (symbol: string) => void;
  selectedSymbol: string;
}

const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  onAssetSelect,
  selectedSymbol,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
  });

  const filteredAssets = assets.filter(asset =>
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssetSelect = (symbol: string) => {
    onAssetSelect(symbol);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  return (
    <nav className="bg-navy-800/90 backdrop-blur-sm border-b border-navy-700 sticky top-0 z-50">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                TradingAI Pro
              </h1>
            </div>
            
            {/* Quick Asset Search */}
            <div className="hidden md:flex items-center relative">
              <div className="relative">
                <div className="flex items-center bg-navy-700 rounded-lg px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400 mr-2" />
                  <Input
                    type="text"
                    placeholder="Buscar ativo (ex: PETR4, BTCUSDT)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="bg-transparent border-none outline-none text-white placeholder-slate-400 w-64 focus:ring-0 focus:border-none"
                  />
                </div>
                
                {/* Search Results Dropdown */}
                {isSearchFocused && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-navy-800 border border-navy-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                    {filteredAssets.length > 0 ? (
                      filteredAssets.slice(0, 10).map((asset) => (
                        <button
                          key={asset.symbol}
                          onClick={() => handleAssetSelect(asset.symbol)}
                          className="w-full px-4 py-2 text-left hover:bg-navy-700 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-white">{asset.symbol}</div>
                            <div className="text-xs text-slate-400">{asset.name}</div>
                          </div>
                          <div className="text-xs text-slate-500 uppercase">
                            {asset.type}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-slate-400 text-sm">
                        Nenhum ativo encontrado
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-lg bg-navy-700 hover:bg-navy-600 transition-colors"
            >
              <Bell className="h-4 w-4 text-slate-300" />
              <span className="sr-only">Notifications</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-lg bg-navy-700 hover:bg-navy-600 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-300" />
              <span className="sr-only">Settings</span>
            </Button>

            <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationHeader;
