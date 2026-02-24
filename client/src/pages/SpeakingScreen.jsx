import { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import toast from 'react-hot-toast';

export default function SpeakingScreen() {
  const { socket, room, playerId, roundData, isHost } = useGame();
  const [timer, setTimer] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [clue, setClue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mode = room?.settings?.mode;
  const timerSeconds = room?.settings?.timerSeconds || 20;
  const order = roundData?.order || [];
  const currentIndex = roundData?.currentSpeakerIndex || 0;
  const currentSpeakerId = order[currentIndex];
  const currentSpeaker = room?.players?.find(p => p.id === currentSpeakerId);
  const isMyTurn = currentSpeakerId === playerId;
  const myClue = roundData?.typedClues?.[playerId];
  const submittedClues = roundData?.typedClues || {};

  useEffect(() => {
    if (!timerActive) return;
    setTimer(timerSeconds);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          if (isHost && mode !== 'onlayn') {
            // auto advance after timer
            setTimeout(() => socket.emit('game:nextSpeaker'), 1000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  const handleStartTimer = () => setTimerActive(true);
  const handleNext = () => {
    socket.emit('game:nextSpeaker');
    setTimerActive(false);
    setTimer(null);
  };

  const handleSubmitClue = () => {
    if (!clue.trim()) return toast.error('یه کلمه بنویس!');
    socket.emit('game:submitClue', { clue: clue.trim() });
    setSubmitted(true);
    setClue('');
  };

  const handleForceVoting = () => {
    socket.emit('game:forceReveal');
  };

  if (!roundData) return null;

  // Online mode: show clue submission
  if (mode === 'onlayn') {
    const allSubmitted = Object.keys(submittedClues).length >= (room?.players?.length || 0);
    return (
      <div className="page hero-bg">
        <div className="page-center">
          <div className="text-center animate-fade">
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>⌨️</div>
            <h2 className="text-xl">مرحله سرنخ‌دادن</h2>
            <p className="text-muted">موضوع: <strong style={{ color: 'var(--accent3)' }}>{roundData.topic}</strong></p>
          </div>

          {!submitted && !myClue ? (
            <div className="card animate-fade" style={{ width: '100%' }}>
              <p style={{ fontWeight: 700, marginBottom: 12, fontSize: '1.05rem' }}>
                {roundData.isChameleon 
                  ? '😰 تو آفتاب‌پرستی! یه کلمه بنویس که لو نده...'
                  : '💡 یه کلمه بنویس که به کلمه مخفی ربط داشته باشه'}
              </p>
              <input
                className="input input-lg"
                placeholder="سرنخ خودت رو بنویس..."
                value={clue}
                onChange={e => setClue(e.target.value)}
                maxLength={30}
                onKeyDown={e => e.key === 'Enter' && handleSubmitClue()}
                autoFocus
              />
              <button className="btn btn-primary btn-lg btn-full" style={{ marginTop: 12 }} onClick={handleSubmitClue}>
                ✅ ثبت سرنخ
              </button>
            </div>
          ) : (
            <div className="card animate-fade" style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>سرنخت ثبت شد!</p>
              <p className="text-muted">منتظر بقیه...</p>
            </div>
          )}

          {/* Progress */}
          <div className="card" style={{ width: '100%' }}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>
              وضعیت ({Object.keys(submittedClues).length}/{room?.players?.length})
            </p>
            {room?.players?.map(p => (
              <div key={p.id} style={{ 
                display: 'flex', alignItems: 'center', gap: 12, 
                padding: '10px 0', borderBottom: '1px solid var(--border)' 
              }}>
                <div className="player-avatar" style={{ width: 36, height: 36, fontSize: '1rem' }}>{p.name[0]}</div>
                <span style={{ flex: 1, fontWeight: 700 }}>{p.name}</span>
                {submittedClues[p.id] ? (
                  <span className="badge badge-green">✓ فرستاد</span>
                ) : (
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text2)' }}>⏳ صبر کن</span>
                )}
              </div>
            ))}
            {allSubmitted && (
              <p className="text-green text-center" style={{ marginTop: 12, fontWeight: 700 }}>
                🎉 همه فرستادن! به مرحله رأی‌گیری رفتیم
              </p>
            )}
          </div>

          {isHost && !allSubmitted && (
            <button className="btn btn-ghost btn-sm" onClick={handleForceVoting}>
              ⏭️ رد کردن و رفتن به رأی‌گیری
            </button>
          )}
        </div>
      </div>
    );
  }

  // Hazouri mode: show speaker and timer
  return (
    <div className="page hero-bg">
      <div className="page-center">
        <div className="text-center animate-fade">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🗣️</div>
          <h2 className="text-xl">مرحله صحبت‌کردن</h2>
          <p className="text-muted">موضوع: <strong style={{ color: 'var(--accent3)' }}>{roundData.topic}</strong></p>
        </div>

        {/* Current speaker */}
        <div className={`card ${isMyTurn ? 'glow-green' : ''} animate-fade`} style={{ width: '100%', textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: 8 }}>نوبت صحبت:</p>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>{isMyTurn ? '🎤' : '👤'}</div>
          <p style={{ fontSize: '1.5rem', fontWeight: 900, color: isMyTurn ? 'var(--green)' : 'var(--text)' }}>
            {currentSpeaker?.name || '...'}
          </p>
          {isMyTurn && (
            <p style={{ color: 'var(--accent2)', fontWeight: 700, marginTop: 8 }}>
              {roundData.isChameleon ? '😰 کلمه رو نمی‌دونی! باهوش باش' : '💡 یه سرنخ بگو!'}
            </p>
          )}
        </div>

        {/* Timer */}
        <div className="card" style={{ width: '100%', textAlign: 'center' }}>
          {timer !== null ? (
            <>
              <div style={{
                fontSize: '4rem',
                fontWeight: 900,
                color: timer <= 5 ? 'var(--accent)' : 'var(--text)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                {timer}
              </div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: `${(timer / timerSeconds) * 100}%` }} />
              </div>
            </>
          ) : (
            <p className="text-muted">تایمر شروع نشده</p>
          )}
        </div>

        {/* Controls */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(isHost || isMyTurn) && !timerActive && timer === null && (
            <button className="btn btn-success btn-lg btn-full" onClick={handleStartTimer}>
              ▶️ شروع تایمر
            </button>
          )}
          {isHost && (
            <button className="btn btn-primary btn-lg btn-full" onClick={handleNext}>
              {currentIndex >= order.length - 1 ? '🗳️ رفتن به رأی‌گیری' : `⏭️ نفر بعدی (${order.length - currentIndex - 1} نفر مونده)`}
            </button>
          )}
        </div>

        {/* Order list */}
        <div className="card" style={{ width: '100%' }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>ترتیب صحبت</p>
          {order.map((pid, i) => {
            const p = room?.players?.find(pl => pl.id === pid);
            return (
              <div key={pid} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
                opacity: i < currentIndex ? 0.4 : 1,
              }}>
                <span style={{ 
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: i === currentIndex ? 'var(--accent)' : 'var(--bg2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, flexShrink: 0
                }}>
                  {i < currentIndex ? '✓' : i + 1}
                </span>
                <span style={{ fontWeight: i === currentIndex ? 700 : 400 }}>
                  {p?.name || '?'}
                  {i === currentIndex && ' 🎤'}
                  {pid === playerId && ' (تو)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
