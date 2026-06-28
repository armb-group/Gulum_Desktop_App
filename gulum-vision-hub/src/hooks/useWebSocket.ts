import { useEffect, useState } from 'react';
import { webSocketService, SubscriptionCallback } from '../services/websocketService';
import { useWebSocketContext } from '../contexts/WebSocketContext';

export function useWebSocket<T = any>(topic: string) {
  const { connected } = useWebSocketContext();
  const [lastMessage, setLastMessage] = useState<T | null>(null);

  useEffect(() => {
    // Only subscribe if we have a valid topic and we are logically supposed to
    // The service handles deferring STOMP subscription until actually connected
    if (!topic) return;

    const callback: SubscriptionCallback = (message: T) => {
      setLastMessage(message);
    };

    const unsubscribe = webSocketService.subscribe(topic, callback);

    return () => {
      unsubscribe();
    };
  }, [topic, connected]); // Re-evaluate if topic or connection status changes

  return { lastMessage, connected };
}
