# O'zbek Content Bot - Backend

Telegram bot orqali Instagram uchun avtomatik rasm va ssenariy generatsiya qiluvchi backend.

## 🚀 Xususiyatlar

- ✅ Telegram bot orqali 10 ta rasm generatsiya qilish
- ✅ Har kuni avtomatik content generatsiya (Cron job)
- ✅ Gemini API orqali rasm va ssenariy yaratish
- ✅ MongoDB'da post history saqlash
- ✅ Instagram'ga avtomatik posting (Meta API)
- ✅ Analytics va statistics

## 📋 Talablar

- Node.js 18+
- MongoDB Atlas (yoki local MongoDB)
- Telegram Bot Token (@BotFather'dan)
- Gemini API Key (Google AI Studio'dan)
- Instagram Business Account (optional)

## 🔧 O'rnatish

### 1. Backend loyihasini klonlash

```bash
cd backend
npm install
```

### 2. Environment variables sozlash

`.env` faylini yarating va quyidagilarni qo'shing:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_GEMINI_API_KEY=your_gemini_key_here
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/uzbek-content
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Bot ishga tushirish

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🤖 Telegram Bot Commands

| Command | Tavsifi |
|---------|---------|
| `/start` | Bot'ni ishga tushirish |
| `/generate` | Darhol 10 ta rasm generatsiya qilish |
| `/schedule` | Avtomatik posting sozlash |
| `/status` | Oxirgi postlarni ko'rish |
| `/help` | Yordam |

## 📅 Avtomatik Scheduling

Bot har kuni **09:00** da avtomatik ravishda:
1. 10 ta rasm generatsiya qiladi
2. Ssenariy va caption yaratadi
3. Telegram'ga yuboradi
4. Database'ga saqlaydi

## 🔗 API Integration

### Gemini API
- Rasm generatsiya: `imagen-3.0-generate-001`
- Ssenariy generatsiya: `gemini-2.5-flash`

### Instagram API (Meta)
- Business Account ID
- Access Token
- Graph API v18.0

## 📊 Database Schema

### Post Collection
```javascript
{
  userId: Number,
  username: String,
  content: [{
    script: [String],
    imageUrl: String,
    imagePrompt: String,
    hashtags: [String]
  }],
  status: 'generated' | 'posted' | 'failed',
  instagramPostId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Railway
```bash
railway link
railway up
```

### Render
```bash
# Connect GitHub repo
# Set environment variables
# Deploy
```

### Heroku
```bash
heroku create your-app-name
heroku config:set TELEGRAM_BOT_TOKEN=xxx
git push heroku main
```

## 📝 Logs

Logs `LOG_LEVEL` environment variable bilan sozlanadi:
- `debug` - Barcha ma'lumotlar
- `info` - Muhim ma'lumotlar
- `warn` - Ogohlantirish
- `error` - Xatolar

## 🔐 Xavfsizlik

- ✅ Environment variables'da sensitive data
- ✅ Rate limiting
- ✅ Error handling
- ✅ Input validation

## 📞 Support

Muammo yoki savol bo'lsa, GitHub issues'da yozing.

## 📄 License

MIT License
