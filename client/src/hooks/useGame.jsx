import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState(() => localStorage.getItem('aftabPlayerId') || null);
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('aftabRoomCode') || null);
  const [phase, setPhase] = useState('home'); // home | lobby | reveal | speaking | voting | guessing | scores | help
  const [roundData, setRoundData] = useState(null); // personal round data with isChameleon

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
      socket, room, setRoom, playerId, roomCode, phase, setPhase,
      roundData, setRoundData, me, isHost, handleLeave
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
