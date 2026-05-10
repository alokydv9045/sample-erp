'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SERVER_BASE_URL } from '@/lib/api/apiConfig';

const SOCKET_URL = SERVER_BASE_URL || 'http://localhost:5001';

// Bug #16 fix: Guard against SSR — only create socket in browser
let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard

    if (!socket) {
      socket = io(SOCKET_URL, {
        withCredentials: true,
      });
    }

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    setIsConnected(socket.connected);

    return () => {
      // We don't disconnect here because we want to reuse the socket across component re-mounts
      // and only have one connection per client.
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket, isConnected };
};
