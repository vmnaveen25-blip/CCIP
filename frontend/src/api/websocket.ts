import { apiClient, API_BASE_URL } from './client';

export type WebSocketListener = (event: { type: string; data: any }) => void;

class EnclaveWebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Set<WebSocketListener> = new Set();
  private reconnectTimeout: any = null;
  private heartbeatInterval: any = null;
  private isExplicitlyClosed: boolean = false;
  private isConnected: boolean = false;

  public connect() {
    this.isExplicitlyClosed = false;
    const token = apiClient.getToken();
    if (!token) {
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const parsedBase = new URL(API_BASE_URL, window.location.origin);
      const wsUrl = `${wsProtocol}//${parsedBase.host}/api/v1/ws?token=${encodeURIComponent(token)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.startHeartbeat();
        this.notifyListeners({ type: 'STATUS_CHANGE', data: { status: 'CONNECTED' } });
      };

      this.ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          const parsed = JSON.parse(event.data);
          this.notifyListeners(parsed);
        } catch {
          this.notifyListeners({ type: 'RAW_MESSAGE', data: event.data });
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.notifyListeners({ type: 'STATUS_CHANGE', data: { status: 'DISCONNECTED' } });
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  public subscribe(listener: WebSocketListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  private notifyListeners(payload: { type: string; data: any }) {
    this.listeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error('[WebSocket] Listener error:', err);
      }
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout || this.isExplicitlyClosed) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 5000);
  }
}

export const enclaveWS = new EnclaveWebSocketService();

// Auto-connect on fresh auth token or disconnect on logout
apiClient.onTokenChange((token) => {
  if (token) {
    enclaveWS.connect();
  } else {
    enclaveWS.disconnect();
  }
});
