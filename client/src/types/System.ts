export interface SystemConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  refreshInterval: number;
  timeframes: string[];
  defaultTimeframe: string;
}

export interface SystemState {
  isConnected: boolean;
  lastUpdate: string;
  errors: SystemError[];
  activeSymbol: string | null;
  activeTimeframe: string;
}

export interface SystemError {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: string;
}
