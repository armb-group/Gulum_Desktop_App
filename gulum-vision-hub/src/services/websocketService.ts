import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type SubscriptionCallback = (message: any) => void;

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;
  private connectionReject: ((err: any) => void) | null = null;
  private subscriptions: Map<string, { callbacks: Set<SubscriptionCallback>; stompSubscription: StompSubscription | null }> = new Map();

  public connect(token?: string) {
    if (this.client && this.client.active) {
      return this.connectionPromise || Promise.resolve();
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;
    });

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    this.client = new Client({
      // We use webSocketFactory because we're using SockJS
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: headers,
      // Default reconnect delay in ms
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('Connected to WebSocket');
      this.connected = true;
      if (this.connectionResolve) {
        this.connectionResolve();
        this.connectionResolve = null;
      }
      this.resubscribeAll();
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
      if (this.connectionReject) {
        this.connectionReject(frame);
        this.connectionReject = null;
      }
    };

    this.client.onWebSocketError = (event) => {
      console.error('WebSocket connection error:', event);
    };

    this.client.onDisconnect = () => {
      console.log('Disconnected from WebSocket');
      this.connected = false;
    };

    this.client.activate();

    return this.connectionPromise;
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
      this.connectionPromise = null;
    }
  }

  public isConnected() {
    return this.connected;
  }

  /**
   * Subscribe to a topic. Ensures only one STOMP subscription exists per topic
   * while allowing multiple React components to register callbacks.
   */
  public subscribe(topic: string, callback: SubscriptionCallback): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, {
        callbacks: new Set(),
        stompSubscription: null,
      });
    }

    const topicData = this.subscriptions.get(topic)!;
    topicData.callbacks.add(callback);

    // If connected, ensure STOMP subscription exists
    if (this.connected && !topicData.stompSubscription) {
      this.createStompSubscription(topic);
    }

    // Return unsubscribe function
    return () => {
      const currentTopicData = this.subscriptions.get(topic);
      if (currentTopicData) {
        currentTopicData.callbacks.delete(callback);
        // If no more callbacks, unsubscribe from STOMP
        if (currentTopicData.callbacks.size === 0) {
          if (currentTopicData.stompSubscription) {
            currentTopicData.stompSubscription.unsubscribe();
          }
          this.subscriptions.delete(topic);
        }
      }
    };
  }

  private createStompSubscription(topic: string) {
    if (!this.client || !this.client.active) return;

    const topicData = this.subscriptions.get(topic);
    if (!topicData) return;

    topicData.stompSubscription = this.client.subscribe(topic, (message: IMessage) => {
      let parsedBody;
      try {
        parsedBody = JSON.parse(message.body);
      } catch (e) {
        parsedBody = message.body;
      }
      
      // Notify all callbacks for this topic
      topicData.callbacks.forEach((cb) => cb(parsedBody));
    });
  }

  private resubscribeAll() {
    this.subscriptions.forEach((topicData, topic) => {
      // Clear old subscription reference just in case
      topicData.stompSubscription = null;
      if (topicData.callbacks.size > 0) {
        this.createStompSubscription(topic);
      }
    });
  }
}

// Export as singleton
export const webSocketService = new WebSocketService();
