import { useState } from 'react';
import { useGame } from '../hooks/useGame';

const CHAMELEON_EMOJIS = ['🦎', '🎭', '🕵️', '🦾', '🐍'];

export default function HomeScreen() {
  const { socket, setPhase } = useGame();
  const [tab, setTab] = useState('create'); // create | join
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const getSessionId = () => {
    let id = localStorage.getItem('aftabPlayerId');
    return id;
  };

  const handleCreate = () => {
    const nick = nickname.trim();
    if (!nick) return;
    setLoading(true);
    localStorage.setItem('aftabNickname', nick);
    socket.emit('room:create', { nickname: nick, sessionId: getSessionId() });
    setTimeout(() => setLoading(false), 3000);
  };

  const handleJoin = () => {
    const nick = nickname.trim();
    const c = code.trim().toUpperCase();
    if (!nick || !c) return;
    setLoading(true);
    localStorage.setItem('aftabNickname', nick);
    socket.emit('room:join', { roomCode: c, nickname: nick, sessionId: getSessionId() });
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="page hero-bg">
      <div className="page-center">
        {/* Logo */}
        <div className="text-center animate-fade" style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '5rem', marginBottom: 8, animation: 'pulse 3s infinite' }}>🦎</div>
          <h1 className="text-3xl" style={{ 
            background: 'linear-gradient(135deg, #e94560, #f5a623)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4
          }}>آفتاب‌پرست</h1>
          <p className="text-muted" style={{ fontSize: '1rem' }}>بازی جاسوسی و فریب دوستات! 🎭</p>
        </div>

        {/* Tab switcher */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg2)', 
          borderRadius: 'var(--radius)',
          padding: 4,
          width: '100%',
          maxWidth: 400
        }}>
          {[['create', '🏠 ساخت اتاق'], ['join', '🚪 ورود به اتاق']].map(([t, label]) => (
            <button
              key={t}
              className="btn"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--text2)',
                borderRadius: 'calc(var(--radius) - 4px)',
                padding: '12px 8px',
                fontSize: '0.9rem'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="card animate-fade" style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: 'var(--text2)', fontSize: '0.9rem' }}>
                اسمت رو بنویس 👤
              </label>
              <input
                className="input input-lg"
                placeholder="مثلاً: کریم خان"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && (tab === 'create' ? handleCreate() : handleJoin())}
              />
            </div>

            {tab === 'join' && (
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: 'var(--text2)', fontSize: '0.9rem' }}>
                  کد اتاق 🔑
                </label>
                <input
                  className="input input-lg"
                  placeholder="کد ۵ حرفی"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={5}
                  style={{ letterSpacing: '0.3em', textAlign: 'center', direction: 'ltr' }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
              </div>
            )}

            <button
              className={`btn btn-lg btn-full ${tab === 'create' ? 'btn-primary' : 'btn-success'}`}
              onClick={tab === 'create' ? handleCreate : handleJoin}
              disabled={loading || !nickname.trim() || (tab === 'join' && code.length < 4)}
            >
              {loading ? '⏳ در حال اتصال...' : tab === 'create' ? '🚀 بزن بریم!' : '🎮 وارد بازی شو!'}
            </button>
          </div>
        </div>

        {/* Help link */}
        <button className="btn btn-ghost btn-sm" onClick={() => setPhase('help')}>
          📖 قوانین بازی
        </button>

        <p className="text-muted" style={{ fontSize: '0.8rem', textAlign: 'center' }}>
          برای ۳ تا ۱۲ نفر · موبایل‌فرندلی 📱
        </p>
      </div>
    </div>
  );
}
