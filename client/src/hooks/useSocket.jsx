import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL, { autoConnect: true, reconnection: true });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('toast', ({ msg, type }) => {
      if (type === 'success') toast.success(msg, { className: 'custom-toast' });
      else if (type === 'warning') toast(msg, { icon: '⚠️', className: 'custom-toast' });
      else toast(msg, { className: 'custom-toast' });
    });

    socket.on('error', ({ msg }) => {
      toast.error(msg, { className: 'custom-toast', duration: 4000 });
    });

    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
