'use client';

import { useEffect } from 'react';

/**
 * WebSocket Prevention Component
 * Prevents development WebSocket connections in production
 * Fixes the "WebSocket connection to 'ws://localhost:8081/' failed" error
 */
export function WebSocketPrevention() {
  useEffect(() => {
    // Only run in production environment
    if (process.env.NODE_ENV === 'production') {
      // Override WebSocket constructor to prevent connections to localhost
      const originalWebSocket = window.WebSocket;
      
      window.WebSocket = class extends originalWebSocket {
        constructor(url: string | URL, protocols?: string | string[]) {
          const urlString = typeof url === 'string' ? url : url.toString();
          
          // Block localhost WebSocket connections (HMR/development)
          if (urlString.includes('localhost') || urlString.includes('127.0.0.1')) {
            console.warn('[Production] Blocked development WebSocket connection:', urlString);
            // Create a closed WebSocket that doesn't actually connect
            super('ws://blocked.local');
            this.close();
            return this;
          }
          
          // Allow other WebSocket connections (if needed for production features)
          super(url, protocols);
        }
      } as any;
      
      // Also prevent EventSource connections (Server-Sent Events for HMR)
      const originalEventSource = window.EventSource;
      
      window.EventSource = class extends originalEventSource {
        constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
          const urlString = typeof url === 'string' ? url : url.toString();
          
          // Block localhost EventSource connections
          if (urlString.includes('localhost') || urlString.includes('127.0.0.1')) {
            console.warn('[Production] Blocked development EventSource connection:', urlString);
            // Create a closed EventSource that doesn't actually connect
            super('http://blocked.local');
            this.close();
            return this;
          }
          
          super(url, eventSourceInitDict);
        }
      } as any;
    }
  }, []);

  return null; // This component doesn't render anything
}