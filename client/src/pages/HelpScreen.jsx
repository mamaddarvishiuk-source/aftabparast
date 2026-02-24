import { useGame } from '../hooks/useGame';

export default function HelpScreen() {
  const { setPhase, phase } = useGame();

  return (
    <div className="page">
      <div style={{ width: '100%', maxWidth: 480, paddingBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingTop: 16 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setPhase('home')} style={{ fontSize: '1.2rem' }}>
            ←
          </button>
          <h1 className="text-xl">📖 قوانین بازی</h1>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 12, color: 'var(--accent3)' }}>
            🦎 آفتاب‌پرست چیه؟
          </h2>
          <p style={{ lineHeight: 2, color: 'var(--text2)' }}>
            یه بازی جاسوسی و فریبه! همه یه کلمه مخفی مشترک دارن، به‌جز یه نفر: آفتاب‌پرست!
            آفتاب‌پرست باید وانمود کنه که کلمه رو می‌دونه. بقیه باید اون رو شناسایی کنن.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 12, color: 'var(--accent2)' }}>
            🎮 چطور بازی می‌کنیم؟
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['1️⃣', 'هاست یه اتاق می‌سازه و بقیه با کد وارد می‌شن'],
              ['2️⃣', 'هر بازیکن رول خودش رو به‌صورت خصوصی می‌بینه'],
              ['3️⃣', 'به ترتیب تصادفی هر نفر یه سرنخ میده (حرف می‌زنه یا تایپ می‌کنه)'],
              ['4️⃣', 'همه رأی می‌دن که فکر می‌کنن آفتاب‌پرسته'],
              ['5️⃣', 'اگه آفتاب‌پرست شناسایی بشه، شانس حدس زدن کلمه داره'],
              ['6️⃣', 'امتیاز گرفتیم، دور بعدی!'],
            ].map(([num, text]) => (
              <div key={num} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{num}</span>
                <span style={{ color: 'var(--text2)', lineHeight: 1.7 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 12, color: 'var(--green)' }}>
            🏆 امتیازات
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['🦎 آفتاب‌پرست فرار کرد', 'آفتاب‌پرست +۲'],
              ['🔍 آفتاب‌پرست لو رفت و کلمه رو درست حدس زد', 'آفتاب‌پرست +۱'],
              ['❌ آفتاب‌پرست لو رفت و اشتباه حدس زد', 'همه بقیه +۲'],
            ].map(([situation, score]) => (
              <div key={situation} style={{
                background: 'var(--bg2)',
                padding: '12px',
                borderRadius: 8,
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text2)' }}>{situation}</div>
                <div style={{ fontWeight: 700, color: 'var(--accent2)' }}>{score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 12, color: 'var(--purple)' }}>
            💡 نکات مهم
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text2)', lineHeight: 1.8 }}>
            <p>🎯 سرنخت نه خیلی واضح باشه (آفتاب‌پرست می‌فهمه) نه خیلی مبهم (مشکوک می‌شی)</p>
            <p>🤐 اگه آفتاب‌پرستی، گوش بده تا از سرنخ بقیه کلمه رو حدس بزنی</p>
            <p>👀 رفتار مشکوک یا مکث زیاد نشونه‌های آفتاب‌پرست هستن</p>
            <p>🗣️ در حالت حضوری، سرنخ باید یه کلمه یا عبارت کوتاه باشه</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: 12, color: 'var(--accent)' }}>
            🎭 مثال
          </h2>
          <div style={{ background: 'var(--bg2)', padding: 16, borderRadius: 12 }}>
            <p style={{ color: 'var(--text2)', marginBottom: 8 }}>موضوع: <strong style={{ color: 'var(--accent3)' }}>حیوانات جنگل</strong></p>
            <p style={{ color: 'var(--text2)', marginBottom: 12 }}>کلمه مخفی: <strong style={{ color: 'var(--green)' }}>شیر</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}><span>علی:</span><span style={{ color: 'var(--text2)' }}>"یال" ← واضحه ولی اوکیه</span></div>
              <div style={{ display: 'flex', gap: 8 }}><span>سارا:</span><span style={{ color: 'var(--text2)' }}>"افریقا" ← کمی مبهم</span></div>
              <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent)' }}>رضا (آفتاب‌پرست):</span><span style={{ color: 'var(--text2)' }}>"ناغ" ← مشکوکه! 😅</span></div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-full" onClick={() => setPhase('home')}>
          🚀 بزن بریم بازی!
        </button>
      </div>
    </div>
  );
}
