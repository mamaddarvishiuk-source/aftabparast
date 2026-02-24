# 🦎 آفتاب‌پرست (Aftabparast)
> بازی جاسوسی پارتی — نسخه فارسی کامل

## ✨ ویژگی‌ها
- بازی جاسوسی اجتماعی برای ۳ تا ۱۲ نفر
- حالت حضوری، آنلاین (تایپ سرنخ) و تمرینی
- سیستم اتاق real-time با Socket.IO
- پک‌های فارسی: شهرها، غذا، فوتبال، فیلم، ماشین، حیوانات و...
- پک دلخواه توسط هاست
- امتیازبندی پیشرفته
- موبایل‌فرندلی، RTL کامل، فونت وزیرمتن

---

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها
- Node.js v18+
- npm یا yarn

### ۱. کلون یا دانلود پروژه
```bash
git clone <repo-url>
cd aftabparast
```

### ۲. راه‌اندازی سرور
```bash
cd server
npm install
npm run dev
# سرور روی پورت 4000 اجرا می‌شه
```

### ۳. راه‌اندازی کلاینت (ترمینال جدید)
```bash
cd client
npm install
npm run dev
# اپ روی http://localhost:3000 باز می‌شه
```

---

## 🌐 دیپلوی

### سرور (Railway / Render / Fly.io)
```bash
cd server
npm start
```
متغیر محیطی: `PORT=4000`

### کلاینت (Vercel / Netlify)
```bash
cd client
npm run build
# فولدر dist رو آپلود کن
```

متغیر محیطی برای کلاینت:
```
VITE_SERVER_URL=https://your-server-url.com
```

---

## 📦 پک‌های کلمات
فایل `server/wordPacks.js` شامل پک‌های آماده‌ست.
برای اضافه کردن پک جدید:
```js
{
  id: "my_pack",
  name: "پک من",
  topics: [
    {
      topic: "موضوع",
      words: ["کلمه۱", "کلمه۲", ...]
    }
  ]
}
```

---

## 🎮 آموزش سریع
1. یه نفر اتاق می‌سازه و کد به بقیه می‌ده
2. همه وارد می‌شن و آماده می‌زنن
3. هاست بازی رو شروع می‌کنه
4. هر نفر رول خودش رو می‌بینه
5. نوبتی سرنخ می‌دن
6. رأی‌گیری → آفتاب‌پرست شناسایی می‌شه؟
7. آفتاب‌پرست یه بار شانس حدس کلمه داره
8. امتیازات → دور بعدی!

---

## 🛠️ معماری
```
/aftabparast
  /server
    index.js        ← Express + Socket.IO
    wordPacks.js    ← پک‌های کلمات
    package.json
  /client
    /src
      App.jsx               ← مسیریاب اصلی
      hooks/useSocket.jsx   ← Socket context
      hooks/useGame.jsx     ← Game state
      pages/
        HomeScreen.jsx
        LobbyScreen.jsx
        RevealScreen.jsx
        SpeakingScreen.jsx
        VotingScreen.jsx
        GuessingScreen.jsx
        ScoresScreen.jsx
        HelpScreen.jsx
```

## رویدادهای Socket
| رویداد | توضیح |
|--------|-------|
| `room:create` | ساخت اتاق جدید |
| `room:join` | ورود به اتاق |
| `room:ready` | آماده شدن بازیکن |
| `room:updateSettings` | تغییر تنظیمات (هاست) |
| `room:kick` | اخراج بازیکن (هاست) |
| `game:startRound` | شروع دور (هاست) |
| `game:revealAck` | تأیید دیدن کلمه |
| `game:submitClue` | ثبت سرنخ (آنلاین) |
| `game:vote` | رأی دادن |
| `game:guessWord` | حدس کلمه (آفتاب‌پرست) |
| `game:nextRound` | دور بعدی (هاست) |
