export type AlertType = 'PRICE' | 'TECHNICAL' | 'PATTERN';

export interface Alert {
  id: string;
  symbol: string;
  type: AlertType;
  condition: string;
  value: number;
  status: 'ACTIVE' | 'TRIGGERED' | 'EXPIRED';
  createdAt: Date;
  triggeredAt?: Date;
}

export interface AlertInput {
  symbol: string;
  type: AlertType;
  condition: string;
  value: number;
}
