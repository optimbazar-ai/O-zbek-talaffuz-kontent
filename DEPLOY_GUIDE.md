# 🚀 Vercel Deploy Yo'riqnomasi

Bu yo'riqnoma loyihani Vercel ga deploy qilish uchun qadam-baqadam ko'rsatma.

## 📋 Deploy qilishdan oldin

### 1. GitHub Repository yaratish

```bash
# Git ni boshlash (agar boshlanmagan bo'lsa)
git init

# Barcha fayllarni qo'shish
git add .

# Commit qilish
git commit -m "Initial commit - Ready for Vercel deploy"

# GitHub repository yarating va push qiling
git remote add origin https://github.com/username/your-repo.git
git branch -M main
git push -u origin main
```

### 2. Local da test qilish

```bash
# Build qilish
npm run build

# Build ni test qilish
npm run preview
```

Agar xatolik bo'lsa, tuzating va qayta urinib ko'ring.

---

## 🎯 Vercel ga Deploy qilish

### Method 1: Vercel Dashboard (Tavsiya etiladi)

#### Step 1: Vercel hisobiga kirish
1. https://vercel.com ga kiring
2. GitHub akkauntingiz bilan sign in qiling

#### Step 2: New Project
1. Dashboard da **"Add New Project"** tugmasini bosing
2. GitHub repository'ingizni toping va **"Import"** bosing

#### Step 3: Configure Project
1. **Framework Preset:** Vite (avtomatik aniqlanadi)
2. **Root Directory:** `.` (default)
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `dist` (default)

#### Step 4: Environment Variables
1. **"Environment Variables"** bo'limiga o'ting
2. Quyidagi variable ni qo'shing:
   - **Name:** `VITE_GEMINI_API_KEY`
   - **Value:** Sizning Gemini API key (https://aistudio.google.com/apikey dan olingan)
   - **Environment:** Production, Preview, Development (barcha checkboxlarni belgilang)
3. **"Add"** bosing

#### Step 5: Deploy
1. **"Deploy"** tugmasini bosing
2. Kutib turing (1-2 daqiqa)
3. ✅ Deploy muvaffaqiyatli!

#### Step 6: Saytni ochish
Deploy tugagach, sizga URL beriladi, masalan:
```
https://your-project.vercel.app
```

---

### Method 2: Vercel CLI

```bash
# 1. Vercel CLI o'rnatish (global)
npm install -g vercel

# 2. Login qilish
vercel login

# 3. Deploy qilish (birinchi marta)
vercel

# Savollar:
# - Set up and deploy? Yes
# - Which scope? Sizning account
# - Link to existing project? No
# - What's your project's name? o'zbek-reels-creator
# - In which directory is your code located? ./
# - Auto-detected Project Settings (Vite)? Yes

# 4. Environment variable qo'shish
# Vercel Dashboard ga boring:
# https://vercel.com/your-account/your-project/settings/environment-variables
# VITE_GEMINI_API_KEY qo'shing

# 5. Production deploy
vercel --prod
```

---

## ✅ Deploy Tekshirish

### 1. Saytni oching
Vercel sizga URL beradi, masalan:
```
https://your-project.vercel.app
```

### 2. Funktsiyalarni test qiling
- ✅ Reel yaratish
- ✅ Rasmlar yuklash
- ✅ Video yuklash
- ✅ Audio yuklash
- ✅ Video download

### 3. Console Errors
Browser console (F12) ni oching va xatoliklar borligini tekshiring.

---

## 🔧 Muammolarni hal qilish

### Muammo 1: "API Key not found"
**Sabab:** Environment variable qo'shilmagan yoki noto'g'ri nom

**Yechim:**
1. Vercel Dashboard → Settings → Environment Variables
2. `VITE_GEMINI_API_KEY` nomini to'g'ri yozing
3. Value ga to'g'ri API key kiriting
4. Redeploy qiling: Settings → Deployments → Latest → Redeploy

### Muammo 2: Build xatolik
**Sabab:** TypeScript yoki dependency xatoliklari

**Yechim:**
1. Local da build qiling: `npm run build`
2. Xatoliklarni tuzating
3. Commit va push qiling
4. Vercel avtomatik qayta deploy qiladi

### Muammo 3: 404 Error
**Sabab:** Routing muammosi

**Yechim:**
- `vercel.json` faylida rewrites to'g'ri sozlangan (biz allaqachon qo'shganmiz)

### Muammo 4: Slow loading
**Sabab:** Build optimizatsiyasi kerak

**Yechim:**
- `vite.config.ts` da code splitting sozlangan (biz allaqachon qo'shganmiz)

---

## 🔄 Yangilash (Update)

Har safar GitHub ga push qilganingizda, Vercel avtomatik deploy qiladi:

```bash
# O'zgarishlarni commit qiling
git add .
git commit -m "Update: qandaydir o'zgartirish"
git push

# Vercel avtomatik deploy qiladi!
```

---

## 🌐 Custom Domain qo'shish

### Step 1: Domain sotib olish
- Namecheap, GoDaddy, yoki boshqa provayderdan

### Step 2: Vercel ga qo'shish
1. Vercel Dashboard → Settings → Domains
2. Domain nomini kiriting: `myreels.uz`
3. DNS sozlamalarini ko'rsatilganday qiling:
   ```
   Type: A Record
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. DNS yangilanishini kuting (1-48 soat)

---

## 📊 Analytics

Vercel bepul analytics beradi:

1. Dashboard → Analytics
2. Ko'ring:
   - Page views
   - Top pages
   - Countries
   - Devices

---

## 💰 Narxlar

**Hobby Plan (Bepul):**
- ✅ Unlimited projects
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ✅ Analytics

Sizning loyihangiz uchun bu yetarli!

---

## 📞 Yordam

Agar qiyinchilik bo'lsa:
1. Vercel Documentation: https://vercel.com/docs
2. Vercel Support: https://vercel.com/support
3. Discord: https://vercel.com/discord

---

## ✨ Deploy muvaffaqiyatli bo'lsin!

Savollar bo'lsa, so'rang! 🚀
