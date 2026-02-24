import { useState } from 'react';
import { useGame } from '../hooks/useGame';
import toast from 'react-hot-toast';

const MODES = [
  { id: 'hazouri', label: 'حضوری 🗣️', desc: 'حرف‌زدن حضوری، رأی‌گیری در اپ' },
  { id: 'onlayn', label: 'آنلاین ⌨️', desc: 'همه سرنخ تایپ می‌کنن' },
  { id: 'tamrini', label: 'تمرینی 🎓', desc: 'آموزش بازی' },
];

const PACKS = [
  { id: 'random', name: '🎲 تصادفی' },
  { id: 'iranian_cities', name: '🏙️ شهرهای ایران' },
  { id: 'food', name: '🍽️ غذاها' },
  { id: 'football', name: '⚽ فوتبال' },
  { id: 'movies', name: '🎬 فیلم' },
  { id: 'cars', name: '🚗 ماشین‌ها' },
  { id: 'brands', name: '🏷️ برندها' },
  { id: 'animals', name: '🐾 حیوانات' },
  { id: 'jobs', name: '💼 مشاغل' },
  { id: 'expressions', name: '💬 اصطلاحات' },
  { id: 'daily', name: '🏠 زندگی روزمره' },
];

export default function LobbyScreen() {
  const { socket, room, playerId, roomCode, isHost, handleLeave, setPhase } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomPack, setShowCustomPack] = useState(false);
  const [customPackName, setCustomPackName] = useState('');
  const [customTopics, setCustomTopics] = useState([{ topic: '', words: '' }]);

  if (!room) return null;

  const me = room.players.find(p => p.id === playerId);
  const canStart = isHost && room.players.length >= 3;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => toast.success('کد کپی شد! ✅'));
  };

  const handleReady = () => {
    socket.emit('room:ready', { ready: !me?.isReady });
  };

  const handleStartGame = () => {
    socket.emit('game:startRound');
  };

  const handleKick = (targetId) => {
    if (window.confirm('مطمئنی؟')) {
      socket.emit('room:kick', { targetId });
    }
  };

  const handleTransferHost = (targetId) => {
    socket.emit('room:transferHost', { targetId });
  };

  const updateSetting = (key, value) => {
    socket.emit('room:updateSettings', { [key]: value });
  };

  const handleAddCustomPack = () => {
    const topics = customTopics
      .filter(t => t.topic.trim() && t.words.trim())
      .map(t => ({ topic: t.topic.trim(), words: t.words.split(',').map(w => w.trim()).filter(Boolean) }));
    if (!customPackName.trim() || topics.length === 0) return toast.error('پک رو کامل کن!');
    socket.emit('room:addCustomPack', { name: customPackName.trim(), topics });
    setShowCustomPack(false);
    setCustomPackName('');
    setCustomTopics([{ topic: '', words: '' }]);
  };

  const s = room.settings;
  const allPacks = [...PACKS, ...(room.customPacks || []).map(p => ({ id: p.id, name: '📦 ' + p.name }))];

  return (
    <div className="page" style={{ paddingTop: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 4 }}>کد اتاق</p>
          <div className="room-code" onClick={handleCopyCode} style={{ cursor: 'pointer' }}>
            {roomCode}
          </div>
          <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
            ضربه بزن برای کپی 👆
          </p>
        </div>

        {/* Players */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>بازیکن‌ها ({room.players.length}/12)</h3>
            <span className={`badge ${room.players.every(p => p.isReady) ? 'badge-green' : 'badge-yellow'}`}>
              {room.players.filter(p => p.isReady).length}/{room.players.length} آماده
            </span>
          </div>

          <div className="player-grid">
            {room.players.map(p => (
              <div key={p.id} className={`player-card ${p.isReady ? 'ready' : ''} ${!p.connected ? 'offline' : ''} ${p.id === room.hostId ? 'host-mark' : ''}`}>
                <div className="player-avatar">{p.name[0]}</div>
                <div className="player-name">{p.name}</div>
                <div>
                  {p.isReady ? <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>آماده ✓</span>
                    : <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>منتظر...</span>}
                </div>
                {p.score > 0 && <div className="player-score">+{p.score} امتیاز</div>}
                {isHost && p.id !== playerId && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                      onClick={() => handleKick(p.id)} title="اخراج">👢</button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                      onClick={() => handleTransferHost(p.id)} title="هاست">👑</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mode selector */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>حالت بازی 🎮</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODES.map(m => (
              <button
                key={m.id}
                className="btn btn-secondary"
                onClick={() => isHost && updateSetting('mode', m.id)}
                style={{
                  justifyContent: 'flex-start',
                  border: s.mode === m.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                  background: s.mode === m.id ? 'rgba(233,69,96,0.1)' : 'var(--card2)',
                  opacity: isHost ? 1 : 0.8,
                  cursor: isHost ? 'pointer' : 'default',
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{m.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{m.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Settings toggle button */}
        {isHost && (
          <button className="btn btn-ghost btn-full" style={{ marginBottom: 8 }} onClick={() => setShowSettings(!showSettings)}>
            ⚙️ تنظیمات {showSettings ? '▲' : '▼'}
          </button>
        )}

        {/* Settings panel */}
        {showSettings && isHost && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="toggle-row">
              <div>
                <div style={{ fontWeight: 700 }}>⏱️ تایمر هر نفر</div>
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>{s.timerSeconds} ثانیه</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[10, 15, 20, 30].map(t => (
                  <button key={t} className="btn btn-sm" style={{
                    background: s.timerSeconds === t ? 'var(--accent)' : 'var(--bg2)',
                    padding: '6px 10px'
                  }} onClick={() => updateSetting('timerSeconds', t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="toggle-row">
              <div style={{ fontWeight: 700 }}>🦎 دو آفتاب‌پرست (۸+ نفر)</div>
              <label className="toggle">
                <input type="checkbox" checked={s.twoChameleons} onChange={e => updateSetting('twoChameleons', e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="toggle-row">
              <div style={{ fontWeight: 700 }}>💪 حالت سخت (۱۰ثانیه دیدن کلمه)</div>
              <label className="toggle">
                <input type="checkbox" checked={s.hardMode} onChange={e => updateSetting('hardMode', e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="toggle-row">
              <div style={{ fontWeight: 700 }}>😊 حالت آسان (۲ بار حدس)</div>
              <label className="toggle">
                <input type="checkbox" checked={s.easyMode} onChange={e => updateSetting('easyMode', e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="toggle-row">
              <div style={{ fontWeight: 700 }}>👪 حالت خانوادگی</div>
              <label className="toggle">
                <input type="checkbox" checked={s.familyMode} onChange={e => updateSetting('familyMode', e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>📦 پک کلمات</div>
              <select
                className="input"
                value={s.selectedPack}
                onChange={e => updateSetting('selectedPack', e.target.value)}
              >
                {allPacks.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button className="btn btn-ghost btn-full" style={{ marginTop: 12 }} onClick={() => setShowCustomPack(!showCustomPack)}>
              ✏️ پک دلخواه بساز
            </button>
            {showCustomPack && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="input" placeholder="اسم پک" value={customPackName} onChange={e => setCustomPackName(e.target.value)} />
                {customTopics.map((t, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--bg2)', padding: 12, borderRadius: 8 }}>
                    <input className="input" placeholder="موضوع (مثلاً: حیوانات جنگل)" value={t.topic}
                      onChange={e => setCustomTopics(prev => { const n = [...prev]; n[i].topic = e.target.value; return n; })} />
                    <textarea className="input" placeholder="کلمات با کاما (گربه, سگ, شیر)" value={t.words} rows={2}
                      onChange={e => setCustomTopics(prev => { const n = [...prev]; n[i].words = e.target.value; return n; })} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm flex-1" onClick={() => setCustomTopics(prev => [...prev, { topic: '', words: '' }])}>
                    + موضوع جدید
                  </button>
                  <button className="btn btn-success btn-sm flex-1" onClick={handleAddCustomPack}>
                    ✅ ذخیره پک
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {!isHost && (
            <button className={`btn btn-lg btn-full ${me?.isReady ? 'btn-secondary' : 'btn-success'}`} onClick={handleReady}>
              {me?.isReady ? '😴 صبر کن (کلیک برای لغو)' : '✅ آماده‌ام!'}
            </button>
          )}

          {isHost && (
            <button
              className={`btn btn-lg btn-full btn-primary ${!canStart ? '' : 'glow-accent'}`}
              onClick={handleStartGame}
              disabled={!canStart}
            >
              {room.players.length < 3 ? '😅 حداقل ۳ نفر لازمه' : `🚀 شروع بازی! (دور ${(room.roundNumber || 0) + 1})`}
            </button>
          )}

          <button className="btn btn-ghost btn-full" onClick={() => { socket.emit('room:leave'); handleLeave(); }}>
            🚪 خروج
          </button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text2)' }} onClick={() => setPhase('help')}>
            📖 قوانین
          </button>
        </div>
      </div>
    </div>
  );
}
