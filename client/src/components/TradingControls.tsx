import { useState } from 'react';
import { useRiskManagement } from '../hooks/useRiskManagement';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './ui/select';

const ORDER_TYPES = [
  { label: 'Mercado', value: 'MARKET' },
  { label: 'Limite', value: 'LIMIT' },
] as const;
type OrderType = typeof ORDER_TYPES[number]['value'];

interface TradeSetup {
  symbol: string;
  orderType: OrderType;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  leverage: number;
}

export function TradingControls() {
  const [tradeSetup, setTradeSetup] = useState<TradeSetup>({
    symbol: '',
    orderType: 'MARKET',
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
            value={tradeSetup.orderType}
            onValueChange={(value: OrderType) => setTradeSetup({ ...tradeSetup, orderType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de Ordem" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Preço de Entrada"
            value={tradeSetup.entryPrice}
            onChange={(e) => setTradeSetup({ ...tradeSetup, entryPrice: parseFloat(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="Stop Loss"
            value={tradeSetup.stopLoss}
            onChange={(e) => setTradeSetup({ ...tradeSetup, stopLoss: parseFloat(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="Take Profit"
            value={tradeSetup.takeProfit}
            onChange={(e) => setTradeSetup({ ...tradeSetup, takeProfit: parseFloat(e.target.value) })}
          />
          <Input
            type="number"
            placeholder="Alavancagem"
            value={tradeSetup.leverage}
            onChange={(e) => setTradeSetup({ ...tradeSetup, leverage: parseInt(e.target.value) })}
          />

          <Button type="submit" variant="default">
            Enviar Ordem
          </Button>
        </div>
      </form>
    </Card>
  );
}
