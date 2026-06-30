import React, { createContext, useContext, useEffect, useState } from 'react';
import { webSocketService } from '../services/websocketService';

interface WebSocketContextType {
  connected: boolean;
  error: Error | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  error: null,
});

export const useWebSocketContext = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Attempt to get token from user object in localStorage
    let token: string | undefined;
    try {
      const userStr = localStorage.getItem('gulum-user');
      if (userStr) {
        const user = JSON.parse(userStr);
        token = user?.token;
      }
    } catch (e) {
      console.error('Error reading auth token from localStorage', e);
    }

    const connectWS = async () => {
      try {
        await webSocketService.connect(token);
        setConnected(true);
        setError(null);
      } catch (err: any) {
        console.error('WebSocket connection failed:', err);
        setError(err instanceof Error ? err : new Error('WebSocket connection failed'));
      }
    };

    connectWS();

    return () => {
      // Disconnect when provider unmounts
      webSocketService.disconnect();
      setConnected(false);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ connected, error }}>
      {children}
    </WebSocketContext.Provider>
  );
};
