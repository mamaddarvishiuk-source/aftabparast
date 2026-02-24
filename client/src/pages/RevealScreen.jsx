import { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGame';

const CHAMELEON_MESSAGES = [
  '😈 تو آفتاب‌پرستی! موضوع رو می‌دونی ولی کلمه رو نه. یه چیز باهوش بگو و لو نده خودت رو!',
  '🦎 شناسایی نشدی! حالا باید خودت رو مثل بقیه جا بزنی. عرق سرد تجربه کن!',
  '🎭 تو همونی که باید نقش بازی کنه! همه کلمه رو می‌دونن غیر از تو. بپیچونشون!',
  '🕵️ مأموریت سرّی: لو نده، گم نشو، شک ایجاد نکن. موفق باشی... نه!',
  '🐍 تو مار تو آستینی! کلمه رو نمی‌دونی ولی موضوع رو داری. بزن به تخته!',
];

export default function RevealScreen() {
  const { socket, room, playerId, roundData, setPhase } = useGame();
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [acked, setAcked] = useState(false);

  const isChameleon = roundData?.isChameleon;
  const chameleonMsg = CHAMELEON_MESSAGES[Math.floor(Math.random() * CHAMELEON_MESSAGES.length)];
  const revealSeconds = room?.settings?.revealSeconds || 10;
  const hardMode = room?.settings?.hardMode;

  useEffect(() => {
    if (!revealed) return;
    if (hardMode) {
      setTimeLeft(revealSeconds);
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(interval); setRevealed(false); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [revealed, hardMode, revealSeconds]);

  const handleAck = () => {
    if (!acked) {
      setAcked(true);
      socket.emit('game:revealAck');
    }
  };

  if (!roundData) return null;

  return (
    <div className="page hero-bg">
      <div className="page-center">
        <div className="text-center animate-fade">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🔒</div>
          <h2 className="text-xl" style={{ marginBottom: 4 }}>نوبت نگاه کردنه!</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>
            دور {roundData?.roundNumber} · موضوع: <strong style={{ color: 'var(--accent3)' }}>{roundData?.topic}</strong>
          </p>
        </div>

        {!revealed ? (
          <div className="card glow-accent animate-fade" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>👁️</div>
            <p style={{ marginBottom: 8, fontWeight: 700, fontSize: '1.1rem' }}>
              مطمئن شو کسی صفحه‌ات رو نمی‌بینه!
            </p>
            <p className="text-muted" style={{ marginBottom: 20, fontSize: '0.9rem' }}>
              بعد از نگاه کردن، سریع «دیدم» رو بزن
            </p>
            <button className="btn btn-primary btn-lg btn-full" onClick={() => setRevealed(true)}>
              👀 نشونم بده!
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {isChameleon ? (
              <div className="reveal-card reveal-chameleon animate-fade">
                <div style={{ fontSize: '4rem' }}>🦎</div>
                <div style={{ 
                  background: 'var(--accent)',
                  padding: '8px 20px',
                  borderRadius: 20,
                  fontWeight: 900,
                  fontSize: '1.1rem'
                }}>
                  😱 تو آفتاب‌پرستی!
                </div>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent3)' }}>
                  موضوع: {roundData.topic}
                </p>
                <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
                  {chameleonMsg}
                </p>
                <p style={{ color: 'var(--accent2)', fontWeight: 700 }}>
                  ⚠️ کلمه رو نمی‌دونی! یه سرنخ باهوش بده
                </p>
              </div>
            ) : (
              <div className="reveal-card reveal-normal animate-fade">
                <div style={{ fontSize: '3rem' }}>🤫</div>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>موضوع</p>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: 'var(--accent3)',
                  padding: '8px 24px',
                  background: 'rgba(78,205,196,0.1)',
                  borderRadius: 12,
                }}>
                  {roundData.topic}
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: 8 }}>کلمه مخفی</p>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--green)',
                  padding: '12px 32px',
                  background: 'rgba(38,222,129,0.1)',
                  border: '2px solid var(--green)',
                  borderRadius: 'var(--radius)',
                  letterSpacing: '0.05em',
                }}>
                  {roundData.secretWord}
                </div>
                {hardMode && timeLeft !== null && (
                  <div>
                    <div className="progress-bar" style={{ marginBottom: 4 }}>
                      <div className="progress-fill" style={{ width: `${(timeLeft / revealSeconds) * 100}%` }} />
                    </div>
                    <p style={{ color: 'var(--accent)', fontWeight: 700 }}>{timeLeft} ثانیه باقی</p>
                  </div>
                )}
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  🤐 به کسی نگو! آفتاب‌پرست نمی‌دونه
                </p>
              </div>
            )}

            <button
              className={`btn btn-lg btn-full ${acked ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleAck}
            >
              {acked ? '⏳ منتظر بقیه...' : '✅ دیدم! آماده‌ام'}
            </button>

            {acked && (
              <p className="text-muted text-center" style={{ fontSize: '0.85rem' }}>
                منتظر بقیه هستیم تا نگاه کنن...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
