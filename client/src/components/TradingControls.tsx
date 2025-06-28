import { useState, useEffect } from 'react';
import { useRiskManagement } from '../hooks/useRiskManagement';
import { TradeSetup, OrderType, PositionSize } from '../types/trading';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select } from './ui/select';
import { Card } from './ui/card';

export function TradingControls() {
  const [tradeSetup, setTradeSetup] = useState<TradeSetup>({
    symbol: '',
    orderType: OrderType.MARKET,
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    positionSize: 0,
    leverage: 1,
  });

  const { calculatePositionSize, calculateRiskReward } = useRiskManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar lógica de envio de ordem
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Select
            label="Tipo de Ordem"
            value={tradeSetup.orderType}
            onChange={(value) => setTradeSetup({ ...tradeSetup, orderType: value })}
            options={[
              { label: 'Mercado', value: OrderType.MARKET },
              { label: 'Limite', value: OrderType.LIMIT },
            ]}
          />
          
          <Input
            label="Preço de Entrada"
            type="number"
            value={tradeSetup.entryPrice}
            onChange={(e) => setTradeSetup({ ...tradeSetup, entryPrice: parseFloat(e.target.value) })}
          />

          <Input
            label="Stop Loss"
            type="number"
            value={tradeSetup.stopLoss}
            onChange={(e) => setTradeSetup({ ...tradeSetup, stopLoss: parseFloat(e.target.value) })}
          />

          <Input
            label="Take Profit"
            type="number"
            value={tradeSetup.takeProfit}
            onChange={(e) => setTradeSetup({ ...tradeSetup, takeProfit: parseFloat(e.target.value) })}
          />

          <Input
            label="Alavancagem"
            type="number"
            value={tradeSetup.leverage}
            onChange={(e) => setTradeSetup({ ...tradeSetup, leverage: parseInt(e.target.value) })}
          />

          <Button type="submit" variant="primary">
            Enviar Ordem
          </Button>
        </div>
      </form>
    </Card>
  );
}
