import { useEffect, useRef, useState, useCallback } from 'react';
import { BACKEND_URL } from './api';

export interface BoardWebSocketEvent {
  type: string;
  board_id?: string;
  card_id?: string;
  list_id?: string;
  user_id?: string;
  [key: string]: any;
}

export function useBoardWebSocket(
  boardId: string | undefined,
  onEvent?: (event: BoardWebSocketEvent) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const isUnmountedRef = useRef(false);

  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (!boardId || isUnmountedRef.current) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Convert http(s) URL to ws(s)
    const base = BACKEND_URL.trim().replace(/\/$/, '');
    const wsProtocol = base.startsWith('https://') ? 'wss://' : 'ws://';
    const hostAndPort = base.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProtocol}${hostAndPort}/api/v1/ws/boards/${boardId}?token=${encodeURIComponent(token)}`;

    try {
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: BoardWebSocketEvent = JSON.parse(event.data);
          if (data.type === 'pong') return;
          if (onEventRef.current) {
            onEventRef.current(data);
          }
        } catch (err) {
          console.warn('[WebSocket] Failed to parse event payload:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (!isUnmountedRef.current) {
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.warn('[WebSocket] Error initiating connection:', err);
    }
  }, [boardId]);

  useEffect(() => {
    isUnmountedRef.current = false;
    connect();

    // Heartbeat ping every 25 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => {
      isUnmountedRef.current = true;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected };
}
