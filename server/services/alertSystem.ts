import { WebSocket } from 'ws';
// Corrigir imports para usar tipos do frontend
import type { Alert, AlertType } from '../../client/src/types/alerts';

export class AlertSystemService {
  private activeAlerts: Map<string, Alert[]> = new Map();
  private idCounter = 1;
  private connections: Set<WebSocket> = new Set();

  async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'status'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: String(this.idCounter++),
      createdAt: new Date(),
      status: 'ACTIVE',
    };
    this.addActiveAlert(newAlert);
    return newAlert;
  }

  private validateAlert(alert: Alert) {
    switch (alert.type) {
      case 'PRICE':
        // Validação simples para PRICE
        if (!alert.condition || typeof alert.value !== 'number') {
          throw new Error('Alerta de preço inválido');
        }
        break;
      case 'TECHNICAL':
        // Validação simples para TECHNICAL
        if (!alert.condition) {
          throw new Error('Alerta técnico inválido');
        }
        break;
      case 'PATTERN':
        // Validação simples para PATTERN
        if (!alert.condition) {
          throw new Error('Alerta de padrão inválido');
        }
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

  // Substituir checkAlerts para usar evaluateAlert
  async checkAlerts(symbol: string, data: any) {
    const alerts = this.activeAlerts.get(symbol) || [];
    for (const alert of alerts) {
      if (this.evaluateAlert(alert, data)) {
        alert.status = 'TRIGGERED';
        alert.triggeredAt = new Date();
      }
    }
  }

  // Remover todos os métodos privados que referenciam PriceAlert, IndicatorAlert, PatternAlert
  // Ajustar avaliação de alerta para operar sobre Alert
  private evaluateAlert(alert: Alert, data: any): boolean {
    // Implementação simplificada: apenas exemplo para PRICE
    if (alert.type === 'PRICE') {
      if (alert.condition === 'above') {
        return data.price > alert.value;
      } else if (alert.condition === 'below') {
        return data.price < alert.value;
      }
    }
    // Para outros tipos, apenas retorna false (ou implemente conforme necessário)
    return false;
  }
}

export const alertSystem = new AlertSystemService();
