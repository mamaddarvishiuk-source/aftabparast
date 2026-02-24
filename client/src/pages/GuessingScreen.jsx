import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import toast from 'react-hot-toast';

export default function GuessingScreen() {
  const { socket, room, playerId, roundData } = useGame();
  const [guess, setGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const chameleonIds = roundData?.chameleonIds || [];
  const chameleonNames = roundData?.chameleonNames || [];
  const isChameleon = chameleonIds.includes(playerId);
  const topic = roundData?.topic;

  const handleGuess = () => {
    if (!guess.trim()) return toast.error('یه کلمه بنویس!');
    setSubmitted(true);
    socket.emit('game:guessWord', { guess: guess.trim() });
  };

  return (
    <div className="page hero-bg">
      <div className="page-center">
        <div className="text-center animate-fade">
          <div style={{ fontSize: '4rem', marginBottom: 8 }}>🔍</div>
          <h2 className="text-xl">آفتاب‌پرست لو رفت!</h2>
          <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem', marginTop: 8 }}>
            {chameleonNames.join(' و ')} آفتاب‌پرست بود!
          </p>
        </div>

        {isChameleon ? (
          <div className="card animate-fade glow-accent" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>😅</div>
            <p style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: 8, color: 'var(--accent2)' }}>
              آخرین شانسته!
            </p>
            <p style={{ marginBottom: 4 }}>
              موضوع: <strong style={{ color: 'var(--accent3)' }}>{topic}</strong>
            </p>
            <p className="text-muted" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
              اگه کلمه مخفی رو درست حدس بزنی، امتیاز می‌گیری!
            </p>
            {!submitted ? (
              <>
                <input
                  className="input input-lg"
                  placeholder="کلمه مخفی چیه؟"
                  value={guess}
                  onChange={e => setGuess(e.target.value)}
                  maxLength={30}
                  onKeyDown={e => e.key === 'Enter' && handleGuess()}
                  autoFocus
                />
                <button className="btn btn-warning btn-lg btn-full" style={{ marginTop: 12 }} onClick={handleGuess}>
                  🎲 حدس می‌زنم!
                </button>
              </>
            ) : (
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>⏳ منتظر نتیجه...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="card animate-fade" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎭</div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>
              آفتاب‌پرست داره کلمه رو حدس می‌زنه...
            </p>
            <p className="text-muted">نفس نکش! 😤</p>
          </div>
        )}
      </div>
    </div>
  );
}
