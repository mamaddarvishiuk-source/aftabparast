import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import toast from 'react-hot-toast';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { socket, connected } = useSocket();
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('aftabPlayerId') || null);
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('aftabRoomCode') || null);
  const [phase, setPhase] = useState('home');
  const [roundData, setRoundData] = useState(null);
  const [disconnectedFor, setDisconnectedFor] = useState(0);

  // If disconnected for more than 15 seconds while in-game, show escape toast
  useEffect(() => {
    if (connected || phase === 'home' || phase === 'help') {
      setDisconnectedFor(0);
      return;
    }
    const interval = setInterval(() => {
      setDisconnectedFor(prev => {
        if (prev >= 15) {
          clearInterval(interval);
          toast(
            (t) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, direction: 'rtl' }}>
                <span>📴 اتصال قطع شد!</span>
                <button
                  style={{
                    background: '#e94560', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
                    fontFamily: 'Vazirmatn, sans-serif', fontWeight: 700
                  }}
                  onClick={() => { toast.dismiss(t.id); handleLeave(); }}
                >
                  🏠 برگشت به خانه
                </button>
              </div>
            ),
            { duration: 30000, className: 'custom-toast' }
          );
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [connected, phase]);

  useEffect(() => {
    if (!socket) return;

    socket.on('room:created', ({ roomCode, playerId, room }) => {
      localStorage.setItem('aftabPlayerId', playerId);
      localStorage.setItem('aftabRoomCode', roomCode);
      setPlayerId(playerId);
      setRoomCode(roomCode);
      setRoom(room);
      setPhase('lobby');
    });

    socket.on('room:joined', ({ roomCode, playerId, room }) => {
      localStorage.setItem('aftabPlayerId', playerId);
      localStorage.setItem('aftabRoomCode', roomCode);
      setPlayerId(playerId);
      setRoomCode(roomCode);
      setRoom(room);
      setPhase(room.phase === 'lobby' ? 'lobby' : room.phase);
    });

    socket.on('room:updated', (room) => {
      setRoom(room);
      if (room.phase === 'lobby') setPhase('lobby');
    });

    socket.on('game:roundStarted', ({ round, settings }) => {
      setRoundData(round);
      setRoom(prev => prev ? { ...prev, settings, phase: 'reveal' } : prev);
      setPhase('reveal');
    });

    socket.on('game:phaseChanged', ({ phase: newPhase, round, players }) => {
      setPhase(newPhase);
      if (round) setRoundData(prev => ({ ...prev, ...round }));
      if (players) setRoom(prev => prev ? { ...prev, players } : prev);
    });

    socket.on('game:clueSubmitted', ({ playerId, clue, submittedCount, total }) => {
      setRoundData(prev => prev ? {
        ...prev,
        typedClues: { ...(prev.typedClues || {}), [playerId]: clue },
        submittedCount, total
      } : prev);
    });

    socket.on('game:voteReceived', ({ votedCount, total }) => {
      setRoundData(prev => prev ? { ...prev, votedCount, total } : prev);
    });

    socket.on('room:kicked', ({ msg }) => {
      toast.error(msg, { className: 'custom-toast' });
      handleLeave();
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:updated');
      socket.off('game:roundStarted');
      socket.off('game:phaseChanged');
      socket.off('game:clueSubmitted');
      socket.off('game:voteReceived');
      socket.off('room:kicked');
    };
  }, [socket]);

  // Try reconnect on mount if we have saved session
  useEffect(() => {
    if (!socket || !playerId || !roomCode) return;
    const savedNickname = localStorage.getItem('aftabNickname');
    if (savedNickname) {
      socket.emit('room:join', { roomCode, nickname: savedNickname, sessionId: playerId });
    }
  }, [socket]);

  const handleLeave = useCallback(() => {
    localStorage.removeItem('aftabRoomCode');
    setRoom(null);
    setRoomCode(null);
    setPhase('home');
    setRoundData(null);
  }, []);

  const me = room?.players?.find(p => p.id === playerId);
  const isHost = room?.hostId === playerId;

  return (
    <GameContext.Provider value={{
      socket, connected, room, setRoom, playerId, roomCode, phase, setPhase,
      roundData, setRoundData, me, isHost, handleLeave
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
