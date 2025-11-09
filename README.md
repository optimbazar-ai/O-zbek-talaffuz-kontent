# 🎬 O'zbek AI Reels Creator

AI-powered Instagram Reels yaratuvchi - Gemini AI bilan.

## ✨ Funksiyalar

- 🤖 **AI Ssenariy** - Avtomatik script yaratish
- 🖼️ **4 ta rasm manbasi:**
  - Avtomatik (Pexels API)
  - Custom kalit so'zlar
  - Rasm yuklash (8 tagacha)
  - Video yuklash (4-8 kadr)
- 🎵 **3 ta audio rejim:**
  - AI ovoz (7 xil)
  - O'z musiqangiz
  - AI ovoz + Orqa musiqa
- 📥 **Video yuklab olish** - MP4 format
- 🔍 **Google Search** - Real-time ma'lumot

## 🚀 Local da ishlatish

### Talablar
- Node.js 18+
- Gemini API key ([olish](https://aistudio.google.com/apikey))

### O'rnatish

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
