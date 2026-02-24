import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './hooks/useSocket';
import { GameProvider, useGame } from './hooks/useGame';
import HomeScreen from './pages/HomeScreen';
import LobbyScreen from './pages/LobbyScreen';
import RevealScreen from './pages/RevealScreen';
import SpeakingScreen from './pages/SpeakingScreen';
import VotingScreen from './pages/VotingScreen';
import GuessingScreen from './pages/GuessingScreen';
import ScoresScreen from './pages/ScoresScreen';
import HelpScreen from './pages/HelpScreen';

function GameRouter() {
  const { phase } = useGame();

  switch (phase) {
    case 'lobby': return <LobbyScreen />;
    case 'reveal': return <RevealScreen />;
    case 'speaking': return <SpeakingScreen />;
    case 'voting': return <VotingScreen />;
    case 'guessing': return <GuessingScreen />;
    case 'scores': return <ScoresScreen />;
    case 'help': return <HelpScreen />;
    default: return <HomeScreen />;
  }
}

export default function App() {
  return (
    <SocketProvider>
      <GameProvider>
        <GameRouter />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e1e3f',
              color: '#f0f0f8',
              border: '1px solid rgba(255,255,255,0.1)',
              fontFamily: "'Vazirmatn', sans-serif",
              direction: 'rtl',
              fontSize: '0.95rem',
              borderRadius: '12px',
              maxWidth: '360px',
            }
          }}
        />
      </GameProvider>
    </SocketProvider>
  );
}
