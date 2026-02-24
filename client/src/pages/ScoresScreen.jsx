import { useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import confetti from 'canvas-confetti';

const RANK_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

export default function ScoresScreen() {
  const { socket, room, playerId, roundData, isHost } = useGame();

  const players = room?.players || [];
  const secretWord = roundData?.secretWord;
  const caught = roundData?.caught;
  const chameleonNames = roundData?.chameleonNames || [];
  const guessResult = roundData?.guessResult;
  const tally = roundData?.tally || {};

  const sorted = [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (caught === false || guessResult?.correct === false) {
      // Everyone wins or chameleon guessed wrong
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);
    }
  }, []);

  const handleNextRound = () => {
    socket.emit('game:nextRound');
  };

  return (
    <div className="page hero-bg">
      <div className="page-center">
        <div className="text-center animate-fade">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>
            {caught ? (guessResult?.correct ? '😱' : '🎉') : '🦎'}
          </div>
          <h2 className="text-xl" style={{ marginBottom: 8 }}>نتیجه دور</h2>

          {/* Result message */}
          <div className="card" style={{ marginBottom: 0 }}>
            {caught !== undefined && (
              <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8, color: caught ? 'var(--accent)' : 'var(--green)' }}>
                {caught ? `🔍 آفتاب‌پرست لو رفت: ${chameleonNames.join(' و ')}` : `🦎 آفتاب‌پرست فرار کرد: ${chameleonNames.join(' و ')}`}
              </p>
            )}
            {secretWord && (
              <p style={{ marginBottom: 8 }}>
                کلمه مخفی بود: <strong style={{ color: 'var(--accent2)', fontSize: '1.3rem' }}>{secretWord}</strong>
              </p>
            )}
            {guessResult && (
              <p style={{
                color: guessResult.correct ? 'var(--accent)' : 'var(--green)',
                fontWeight: 700
              }}>
                {guessResult.correct
                  ? `😱 آفتاب‌پرست "${guessResult.guess}" رو درست حدس زد!`
                  : `😅 آفتاب‌پرست "${guessResult.guess}" گفت ولی اشتباه بود!`}
              </p>
            )}
          </div>
        </div>

        {/* Tally */}
        {Object.keys(tally).length > 0 && (
          <div className="card animate-fade" style={{ width: '100%' }}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>🗳️ آرای مردمی</p>
            {players.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 0', borderBottom: '1px solid var(--border)'
              }}>
                <div className="player-avatar" style={{ width: 36, height: 36, fontSize: '1rem' }}>{p.name[0]}</div>
                <span style={{ flex: 1, fontWeight: 700 }}>{p.name}</span>
                <div style={{
                  background: 'rgba(233,69,96,0.15)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontWeight: 700,
                  color: 'var(--accent)'
                }}>
                  {tally[p.id] || 0} رأی
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scoreboard */}
        <div className="card animate-fade" style={{ width: '100%' }}>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>🏆 جدول امتیازات</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.map((p, i) => (
              <div key={p.id} className="score-item" style={{
                background: p.id === playerId ? 'rgba(233,69,96,0.1)' : 'var(--card2)',
                border: p.id === playerId ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}>
                <div className="score-rank">{RANK_EMOJIS[i] || (i + 1)}</div>
                <div className="score-name">{p.name} {p.id === playerId && '(تو)'}</div>
                <div className="score-pts">{p.score} 🌟</div>
              </div>
            ))}
          </div>
        </div>

        {isHost ? (
          <button className="btn btn-primary btn-lg btn-full animate-fade" onClick={handleNextRound}>
            🔄 دور بعدی!
          </button>
        ) : (
          <p className="text-muted text-center">⏳ منتظر هاست برای دور بعد...</p>
        )}
      </div>
    </div>
  );
}
