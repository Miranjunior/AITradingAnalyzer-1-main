import { useState } from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { Alert, AlertInput, AlertType } from '../types/alerts';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog } from './ui/dialog';
import { Input } from './ui/input';
import { Select } from './ui/select';

interface AlertsPanelProps {
  symbol: string | undefined;
  onClose: () => void;
  className?: string;
}

export function AlertsPanel({
  symbol,
  onClose,
  className = ''
}: AlertsPanelProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { alerts, isLoading, createAlert, deleteAlert } = useAlerts(symbol);

  const handleCreateAlert = async (alertInput: AlertInput) => {
    try {
      await createAlert.mutateAsync(alertInput);
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await deleteAlert.mutateAsync(alertId);
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  return (
    <div className={`bg-gray-900 p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Alertas</h2>
        <div className="space-x-2">
          <Button
            variant="default"
            onClick={() => setShowCreateDialog(true)}
            disabled={!symbol}
          >
            Novo Alerta
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <span className="sr-only">Fechar</span>
            ✕
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-800 rounded"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onDelete={() => handleDeleteAlert(alert.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          Nenhum alerta configurado
        </p>
      )}

      <CreateAlertDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreate={handleCreateAlert}
        symbol={symbol}
      />
    </div>
  );
}

interface AlertCardProps {
  alert: Alert;
  onDelete: () => void;
}

function AlertCard({ alert, onDelete }: AlertCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'TRIGGERED':
        return 'bg-yellow-500';
      case 'EXPIRED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-4 bg-gray-800">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Badge className={getStatusColor(alert.status)}>
              {alert.status}
            </Badge>
            <span className="text-sm text-gray-400">{alert.type}</span>
          </div>
          <p className="text-sm mb-1">{alert.description}</p>
          {alert.expiresAt && (
            <p className="text-xs text-gray-500">
              Expira em: {new Date(alert.expiresAt).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-red-400 hover:text-red-300"
        >
          Deletar
        </Button>
      </div>
    </Card>
  );
}

interface CreateAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (alert: AlertInput) => void;
  symbol: string | undefined;
}

function CreateAlertDialog({
  isOpen,
  onClose,
  onCreate,
  symbol
}: CreateAlertDialogProps) {
  const [alertType, setAlertType] = useState<AlertType>('PRICE');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState('ABOVE');
  const [indicator, setIndicator] = useState('RSI');
  const [threshold, setThreshold] = useState('');
  const [pattern, setPattern] = useState('HAMMER');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return;

    const alertInput: AlertInput = {
      symbol,
      type: alertType,
      status: 'ACTIVE',
      ...(alertType === 'PRICE' && {
        price: Number(price),
        condition
      }),
      ...(alertType === 'INDICATOR' && {
        indicator,
        threshold: Number(threshold),
        condition
      }),
      ...(alertType === 'PATTERN' && {
        pattern,
        minConfidence: 70
      })
    };

    onCreate(alertInput);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Criar Novo Alerta</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Tipo de Alerta</label>
            <Select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as AlertType)}
              className="w-full"
            >
              <option value="PRICE">Preço</option>
              <option value="INDICATOR">Indicador</option>
              <option value="PATTERN">Padrão</option>
            </Select>
          </div>

          {alertType === 'PRICE' && (
            <>
              <div>
                <label className="block text-sm mb-1">Preço</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="any"
                  required
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Condição</label>
                <Select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="ABOVE">Acima</option>
                  <option value="BELOW">Abaixo</option>
                  <option value="EQUALS">Igual</option>
                </Select>
              </div>
            </>
          )}

          {alertType === 'INDICATOR' && (
            <>
              <div>
                <label className="block text-sm mb-1">Indicador</label>
                <Select
                  value={indicator}
                  onChange={(e) => setIndicator(e.target.value)}
                >
                  <option value="RSI">RSI</option>
                  <option value="MACD">MACD</option>
                  <option value="STOCH">Estocástico</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1">Valor</label>
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  step="any"
                  required
                />
              </div>
            </>
          )}

          {alertType === 'PATTERN' && (
            <div>
              <label className="block text-sm mb-1">Padrão</label>
              <Select
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              >
                <option value="HAMMER">Hammer</option>
                <option value="DOJI">Doji</option>
                <option value="ENGULFING">Engulfing</option>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="default">
              Criar Alerta
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
