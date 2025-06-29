import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Target, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { BinarySignal } from '@/types/trading';

interface BinaryOptionsPanelProps {
  selectedSymbol?: string;
}

const BinaryOptionsPanel: React.FC<BinaryOptionsPanelProps> = ({ selectedSymbol }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('5m');
  const [investment, setInvestment] = useState(100);

  const { data: binarySignals = [], isLoading } = useQuery<BinarySignal[]>({
    queryKey: ['/api/binary-signals'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: forexSignals = [] } = useQuery<BinarySignal[]>({
    queryKey: ['/api/forex-signals'],
    refetchInterval: 60000, // Refresh every minute
  });

  const timeframes = ['1m', '5m', '15m', '1h'];
  const investmentAmounts = [50, 100, 250, 500, 1000];

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence >= 80) return 'default';
    if (confidence >= 60) return 'secondary';
    return 'destructive';
  };

  const handleTrade = async (signal: BinarySignal, prediction: 'higher' | 'lower') => {
    try {
      const response = await apiRequest('POST', '/api/binary-trade', {
        userId: 1, // Mock user ID
        optionSymbol: signal.symbol,
        prediction,
        investment
      });

      if (response.ok) {
        console.log('Trade executed successfully');
      }
    } catch (error) {
      console.error('Error executing trade:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Trading Controls */}
      <Card className="p-4 bg-navy-800/50 border-navy-600">
        <h3 className="text-lg font-semibold text-white mb-3">Operações Binárias</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Timeframe</label>
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={selectedTimeframe === tf ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeframe(tf)}
                  className="text-xs"
                >
                  {tf}
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Investimento (USD)</label>
            <div className="flex gap-2 flex-wrap">
              {investmentAmounts.map((amount) => (
                <Button
                  key={amount}
                  variant={investment === amount ? "default" : "outline"}
                  size="sm"
                  onClick={() => setInvestment(amount)}
                  className="text-xs"
                >
                  ${amount}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Active Signals */}
      <Card className="p-4 bg-navy-800/50 border-navy-600">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Sinais Ativos</h3>
          <Badge variant="outline" className="text-xs">
            {binarySignals.length} sinais
          </Badge>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-slate-400 text-sm mt-2">Carregando sinais...</p>
            </div>
          ) : binarySignals.length === 0 ? (
            <div className="text-center py-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Nenhum sinal ativo no momento</p>
            </div>
          ) : (
            binarySignals.map((signal: BinarySignal) => (
              <div
                key={signal.id}
                className="p-3 bg-navy-700/50 rounded-lg border border-navy-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{signal.symbol}</span>
                    <Badge variant={getConfidenceBadgeVariant(signal.confidence)}>
                      {signal.confidence}%
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-slate-400 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeRemaining(signal.expiresAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {signal.direction === 'call' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${signal.direction === 'call' ? 'text-green-500' : 'text-red-500'}`}>
                      {signal.direction.toUpperCase()}
                    </span>
                  </div>
                  
                  <span className="text-xs text-slate-400">{signal.timeframe}</span>
                </div>

                <p className="text-xs text-slate-400 mb-3">{signal.reasoning}</p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleTrade(signal, 'higher')}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    CALL
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleTrade(signal, 'lower')}
                  >
                    <TrendingDown className="h-3 w-3 mr-1" />
                    PUT
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Forex Signals */}
      {forexSignals.length > 0 && (
        <Card className="p-4 bg-navy-800/50 border-navy-600">
          <h3 className="text-lg font-semibold text-white mb-3">Sinais Forex</h3>
          <div className="space-y-2">
            {forexSignals.slice(0, 3).map((signal: BinarySignal, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-navy-700/30 rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white">{signal.symbol}</span>
                  {signal.direction === 'call' ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {signal.confidence}%
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BinaryOptionsPanel;