import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import toast from 'react-hot-toast';

export default function VotingScreen() {
  const { socket, room, playerId, roundData, isHost } = useGame();
  const [myVote, setMyVote] = useState(null);

  const votedCount = roundData?.votedCount || Object.keys(roundData?.votes || {}).length || 0;
  const total = room?.players?.length || 0;
  const mode = room?.settings?.mode;
  const clues = roundData?.typedClues || {};

  const handleVote = (targetId) => {
    if (myVote) return toast('قبلاً رأی دادی! 😅');
    setMyVote(targetId);
    socket.emit('game:vote', { accusedId: targetId });
  };

  const handleForceReveal = () => {
    socket.emit('game:forceReveal');
  };

  if (!room) return null;

  return (
    <div className="page hero-bg">
      <div className="page-center">
        <div className="text-center animate-fade">
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🗳️</div>
          <h2 className="text-xl">رأی‌گیری</h2>
          <p className="text-muted">
            موضوع: <strong style={{ color: 'var(--accent3)' }}>{roundData?.topic}</strong>
          </p>
          <p style={{ marginTop: 8, color: 'var(--accent2)', fontWeight: 700 }}>
            {votedCount}/{total} رأی داده
          </p>
          <div className="progress-bar" style={{ marginTop: 8, maxWidth: 200, margin: '8px auto 0' }}>
            <div className="progress-fill" style={{ width: `${total ? (votedCount / total) * 100 : 0}%` }} />
          </div>
        </div>

        {/* Show clues in online mode */}
        {mode === 'onlayn' && Object.keys(clues).length > 0 && (
          <div className="card animate-fade" style={{ width: '100%' }}>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>🔍 سرنخ‌های همه</p>
            {room.players.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid var(--border)'
              }}>
                <div className="player-avatar" style={{ width: 36, height: 36, fontSize: '1rem' }}>{p.name[0]}</div>
                <span style={{ flex: 1, fontWeight: 700 }}>{p.name}</span>
                <span style={{
                  background: 'rgba(78,205,196,0.15)',
                  color: 'var(--accent3)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {clues[p.id] || '---'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Vote area */}
        {!myVote ? (
          <div className="card animate-fade" style={{ width: '100%' }}>
            <p style={{ fontWeight: 700, marginBottom: 16, fontSize: '1.05rem', color: 'var(--accent)' }}>
              🎯 به نظرت کی آفتاب‌پرسته؟
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {room.players.filter(p => p.id !== playerId).map(p => (
                <button
                  key={p.id}
                  className="vote-btn"
                  onClick={() => handleVote(p.id)}
                >
                  <div className="player-avatar" style={{ width: 40, height: 40, fontSize: '1.1rem' }}>{p.name[0]}</div>
                  <span style={{ flex: 1, textAlign: 'right' }}>{p.name}</span>
                  <span style={{ fontSize: '1.3rem' }}>🦎?</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="card animate-fade" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>رأی دادی!</p>
            <p className="text-muted">منتظر بقیه...</p>
            <div style={{
              marginTop: 12,
              padding: '12px',
              background: 'rgba(233,69,96,0.1)',
              borderRadius: 12,
              border: '1px solid var(--accent)'
            }}>
              <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>رأی تو:</p>
              <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent)' }}>
                {room.players.find(p => p.id === myVote)?.name}
              </p>
            </div>
          </div>
        )}

        {isHost && (
          <button className="btn btn-ghost btn-sm" onClick={handleForceReveal}>
            ⏭️ اعلام نتیجه (بدون صبر کردن)
          </button>
        )}
      </div>
    </div>
  );
}
