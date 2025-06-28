import { WebSocket } from 'ws';
import { storage } from '../storage';
import { 
  Alert,
  AlertCondition,
  AlertType,
  PriceAlert,
  IndicatorAlert,
  PatternAlert
} from '../../shared/types/alerts';

export class AlertSystemService {
  private activeAlerts: Map<string, Alert[]> = new Map();
  private connections: Set<WebSocket> = new Set();

  async createAlert(alert: Alert): Promise<Alert> {
    try {
      // Validar alerta
      this.validateAlert(alert);
      
      // Salvar no banco
      const savedAlert = await storage.createAlert(alert);
      
      // Adicionar aos alertas ativos
      this.addActiveAlert(savedAlert);
      
      return savedAlert;
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      throw error;
    }
  }

  private validateAlert(alert: Alert) {
    switch (alert.type) {
      case 'PRICE':
        this.validatePriceAlert(alert as PriceAlert);
        break;
      case 'INDICATOR':
        this.validateIndicatorAlert(alert as IndicatorAlert);
        break;
      case 'PATTERN':
        this.validatePatternAlert(alert as PatternAlert);
        break;
      default:
        throw new Error(`Tipo de alerta inválido: ${alert.type}`);
    }
  }

  private addActiveAlert(alert: Alert) {
    const symbol = alert.symbol;
    if (!this.activeAlerts.has(symbol)) {
      this.activeAlerts.set(symbol, []);
    }
    this.activeAlerts.get(symbol)!.push(alert);
  }

  async checkAlerts(symbol: string, data: any) {
    const alerts = this.activeAlerts.get(symbol) || [];
    
    for (const alert of alerts) {
      try {
        const triggered = await this.evaluateAlertCondition(alert, data);
        
        if (triggered) {
          await this.triggerAlert(alert);
        }
      } catch (error) {
        console.error(`Erro ao verificar alerta ${alert.id}:`, error);
      }
    }
  }

  private async evaluateAlertCondition(alert: Alert, data: any): Promise<boolean> {
    switch (alert.type) {
      case 'PRICE':
        return this.evaluatePriceAlert(alert as PriceAlert, data);
      case 'INDICATOR':
        return this.evaluateIndicatorAlert(alert as IndicatorAlert, data);
      case 'PATTERN':
        return this.evaluatePatternAlert(alert as PatternAlert, data);
      default:
        return false;
    }
  }

  private async triggerAlert(alert: Alert) {
    try {
      // Atualizar status do alerta
      await storage.updateAlertStatus(alert.id, 'TRIGGERED');
      
      // Notificar clientes conectados
      this.notifyClients(alert);
      
      // Remover dos alertas ativos se for único
      if (!alert.recurring) {
        this.removeActiveAlert(alert);
      }
      
    } catch (error) {
      console.error(`Erro ao disparar alerta ${alert.id}:`, error);
    }
  }

  private notifyClients(alert: Alert) {
    const notification = {
      type: 'ALERT',
      data: alert
    };

    this.connections.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
  }

  // Métodos específicos para cada tipo de alerta
  private validatePriceAlert(alert: PriceAlert) {
    if (!alert.price || !alert.condition) {
      throw new Error('Alerta de preço inválido');
    }
  }

  private validateIndicatorAlert(alert: IndicatorAlert) {
    if (!alert.indicator || !alert.threshold || !alert.condition) {
      throw new Error('Alerta de indicador inválido');
    }
  }

  private validatePatternAlert(alert: PatternAlert) {
    if (!alert.pattern) {
      throw new Error('Alerta de padrão inválido');
    }
  }

  private evaluatePriceAlert(alert: PriceAlert, data: any): boolean {
    const currentPrice = parseFloat(data.price);
    const targetPrice = parseFloat(alert.price);

    switch (alert.condition) {
      case 'ABOVE':
        return currentPrice > targetPrice;
      case 'BELOW':
        return currentPrice < targetPrice;
      case 'EQUALS':
        return Math.abs(currentPrice - targetPrice) < 0.0001;
      default:
        return false;
    }
  }

  private evaluateIndicatorAlert(alert: IndicatorAlert, data: any): boolean {
    const currentValue = parseFloat(data.indicators[alert.indicator]);
    const threshold = parseFloat(alert.threshold);

    switch (alert.condition) {
      case 'ABOVE':
        return currentValue > threshold;
      case 'BELOW':
        return currentValue < threshold;
      case 'CROSSES_ABOVE':
        return this.detectCrossing(data, alert, 'above');
      case 'CROSSES_BELOW':
        return this.detectCrossing(data, alert, 'below');
      default:
        return false;
    }
  }

  private evaluatePatternAlert(alert: PatternAlert, data: any): boolean {
    return data.patterns.some((p: any) => 
      p.name === alert.pattern && p.confidence >= (alert.minConfidence || 70)
    );
  }

  private detectCrossing(data: any, alert: IndicatorAlert, direction: 'above' | 'below'): boolean {
    const current = parseFloat(data.indicators[alert.indicator]);
    const previous = parseFloat(data.previousIndicators[alert.indicator]);
    const threshold = parseFloat(alert.threshold);

    if (direction === 'above') {
      return previous < threshold && current > threshold;
    } else {
      return previous > threshold && current < threshold;
    }
  }

  private removeActiveAlert(alert: Alert) {
    const alerts = this.activeAlerts.get(alert.symbol);
    if (alerts) {
      const index = alerts.findIndex(a => a.id === alert.id);
      if (index !== -1) {
        alerts.splice(index, 1);
      }
    }
  }
}

export const alertSystem = new AlertSystemService();
