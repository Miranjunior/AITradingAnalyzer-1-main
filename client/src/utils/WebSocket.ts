import { config } from '../config';
import { SystemState } from '../types/system';

type MessageHandler = (data: any) => void;
type ConnectionHandler = (state: boolean) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private connectionHandlers: ConnectionHandler[] = [];
  private reconnectTimeout: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(config.wsBaseUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.notifyConnectionHandlers(true);
    };

    this.ws.onclose = () => {
      this.notifyConnectionHandlers(false);
      this.attemptReconnect();
    };

    this.ws.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);
        this.notifyMessageHandlers(type, data);
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.reconnectTimeout);
    }
  }

  private notifyMessageHandlers(type: string, data: any) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  subscribe(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)?.push(handler);
  }

  unsubscribe(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      this.messageHandlers.set(
        type,
        handlers.filter(h => h !== handler)
      );
    }
  }

  onConnectionChange(handler: ConnectionHandler) {
    this.connectionHandlers.push(handler);
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

export const websocket = new WebSocketService();
