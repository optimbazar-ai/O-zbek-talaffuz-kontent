# 🎬 O'zbek AI Reels Creator + Telegram Bot

AI-powered Instagram Reels yaratuvchi + Telegram bot orqali avtomatik posting.

## ✨ Funksiyalar

### 🌐 Frontend (Web App)
- 🤖 **AI Ssenariy** - Gemini orqali avtomatik script yaratish
- 🖼️ **Rasm generatsiya** - Imagen 3 orqali haqiqiy rasmlar
- 🎵 **AI Ovoz** - O'zbek talaffuzi bilan TTS
- 📥 **Video yuklab olish** - MP4 format
- 🔍 **Google Search** - Real-time ma'lumot

### 🤖 Backend (Telegram Bot)
- ✅ **Telegram Bot** - `/generate`, `/schedule`, `/status` commands
- ✅ **Avtomatik Scheduling** - Har kuni 09:00 da 10 ta rasm generatsiya
- ✅ **Instagram Integration** - Meta API orqali avtomatik posting
- ✅ **Database** - MongoDB'da post history
- ✅ **Analytics** - Post statistics va engagement

## 🚀 Local da ishlatish

### Talablar
- Node.js 18+
- Gemini API key ([olish](https://aistudio.google.com/apikey))
- Telegram Bot Token (@BotFather'dan)
- MongoDB Atlas (yoki local MongoDB)

### Frontend O'rnatish

```bash
# 1. Repository ni clone qiling
git clone <repo-url>
cd o'zbek-talaffuzda-yaxshi

# 2. Dependencies o'rnating
npm install

# 3. Environment variable yarating
cp .env.example .env.local

# 4. .env.local da API key qo'shing
VITE_GEMINI_API_KEY=your_api_key_here

# 5. Development serverni ishga tushiring
npm run dev
```

Brauzerda oching: http://localhost:3004

### Backend (Telegram Bot) O'rnatish

```bash
# 1. Backend dependencies o'rnating
npm run backend:install

# 2. Backend .env yarating
cp backend/.env.example backend/.env

# 3. Backend .env'da quyidagilarni qo'shing:
TELEGRAM_BOT_TOKEN=your_bot_token
VITE_GEMINI_API_KEY=your_gemini_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/uzbek-content

# 4. Backend'ni ishga tushiring
npm run backend:dev
```

Bot ishga tushdi! Telegram'da @BotFather orqali yaratgan bot'ingizga `/start` yozing.

## 📦 Deploy (Vercel)

### Method 1: Vercel Dashboard (Eng oson)

1. [Vercel](https://vercel.com) ga kiring
2. "New Project" bosing
3. GitHub repository ni import qiling
4. Environment Variable qo'shing:
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** sizning Gemini API key
5. "Deploy" bosing

### Method 2: Vercel CLI

```bash
# 1. Vercel CLI o'rnating
npm i -g vercel

# 2. Deploy qiling
vercel

# 3. Environment variable qo'shing (web dashboard da)
# Settings → Environment Variables
# VITE_GEMINI_API_KEY = your_key

# 4. Production deploy
vercel --prod
```

### Environment Variables (Vercel)

Vercel Dashboard da qo'shing:
- `VITE_GEMINI_API_KEY` - Gemini API key

## 🛠️ Build

```bash
# Production build
npm run build

# Build ni test qilish
npm run preview

# TypeScript type check
npm run type-check
```

## 📁 Loyiha tuzilishi

```
├── src/
│   ├── components/      # React komponentlar
│   ├── services/        # API xizmatlari (Gemini)
│   ├── utils/           # Yordamchi funksiyalar
│   ├── types.ts         # TypeScript turlari
│   └── constants.ts     # O'zgarmas qiymatlar
├── public/              # Statik fayllar
├── .env.example         # Environment variable namunasi
├── vercel.json          # Vercel konfiguratsiyasi
└── vite.config.ts       # Vite konfiguratsiyasi
```

## 🔧 Texnologiyalar

- **Frontend:** React 19 + TypeScript
- **Build:** Vite 6
- **AI:** Google Gemini 2.5
- **Styling:** Tailwind CSS (inline)
- **APIs:** Pexels, Google Search

## 📝 Litsenziya

MIT

## 🤝 Hissa qo'shish

Pull request'lar xush kelibsiz!
