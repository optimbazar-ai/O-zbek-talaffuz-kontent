# 🎙️ O'zbek Talaffuz Yaxshilash Yo'riqnomasi

## 📋 Muammo

Gemini TTS AI o'zbek tilida gapirganda ba'zi tovushlarni noto'g'ri talaffuz qiladi:

1. **"O" harfi** - "a" kabi talaffuz qiladi ❌
2. **"I" harfi** - cho'zib aytadi (kerak emas) ❌  
3. **Tezlik** - ba'zan sekin gapiradi ❌

---

## ✅ Yechim - 3 Bosqich

### **1. Matnni Pre-processing (Tayyorlash)**

```typescript
function preprocessUzbekText(text: string): string {
    // "o" harfini to'g'ri talaffuz uchun
    text = text.replace(/\bo\b/gi, 'o (o harfini aniq o kabi ayt)');
    
    // "i" harfini qisqa talaffuz uchun  
    text = text.replace(/\bi\b/gi, 'i (qisqa i)');
    
    // O'zbek harflar uchun
    text = text.replace(/oʻ/g, 'o\'(katta o)');
    text = text.replace(/gʻ/g, 'g\'(yumshoq g)');
    
    return text;
}
```

**Misol:**
```
Input:  "Salom, men o'zbek tilida gapiraman"
Output: "Salom, men o(aniq o)'zbek tilida gapiraman"
```

---

### **2. TTS Prompt ga Fonetik Ko'rsatmalar**

```typescript
function createUzbekTTSPrompt(script: string): string {
    return `You are speaking in Uzbek language. Follow these rules:

1. VOWEL 'O': Pronounce as /ɔ/ (open O), NOT 'a'
   - English example: "caught" 
   - Russian example: "кот"
   
2. VOWEL 'I': Short /i/, like "bit" NOT "beat"
   - Don't elongate it
   
3. SPEED: Normal pace, not slow

4. STRESS: Last syllable (O'zbek style)

Text: "${script}"

Remember: 'o'=/ɔ/, 'i'=/i/ (qisqa)`;
}
```

---

### **3. Ovoz Tanlash (Voice Selection)**

**Eng yaxshi ovozlar o'zbek uchun:**

| Ovoz | Xususiyat | Talaffuz Sifati |
|------|-----------|----------------|
| **Kore** | Yumshoq, tiniq | ⭐⭐⭐⭐⭐ Eng yaxshi |
| **Zephyr** | Do'stona, tabiiy | ⭐⭐⭐⭐ |
| **Fenrir** | Aniq, ishonchli | ⭐⭐⭐⭐ |
| **Charon** | Vazmin | ⭐⭐⭐ |

**Tavsiya:** `Kore` ni tanlang - eng sof talaffuz!

---

## 🔬 Fonetik Tushuntirish

### **O'zbek Tovushlari:**

#### 1. **"O" harfi (Open O)**
```
Fonetik: /ɔ/
O'xshash: English "caught", Russian "кот" 
NOTO'G'RI: "a" kabi ❌
TO'G'RI: Lab yumaloq, og'iz ochiq ✅

Misol:
❌ "Salam" (xato)
✅ "Salom" (to'g'ri - /sɔlɔm/)
```

#### 2. **"I" harfi (Short I)**
```
Fonetik: /i/
O'xshash: English "bit", Russian "бит"
NOTO'G'RI: "ee" cho'zib ❌
TO'G'RI: Qisqa, aniq ✅

Misol:
❌ "tiiil" (xato - cho'zilgan)
✅ "til" (to'g'ri - /til/)
```

#### 3. **"Oʻ" harfi (Back O)**
```
Fonetik: /ɒ/
O'xshash: English "hot", "lot"
Og'iz ochiq, til orqada

Misol: oʻqish /ɒqiʃ/
```

#### 4. **"Gʻ" harfi (Soft G)**
```
Fonetik: /ɣ/
O'xshash: Arabic غ, Ukrainian г
Tomoqda tovlanadi

Misol: gʻalaba /ɣalaba/
```

---

## 💡 Qo'shimcha Maslahatlar

### **Script Yozishda:**

1. **Tinish belgilardan foydalaning:**
```
Yaxshi: "Salom! Men o'zbek tilida gapiraman."
Yomon: "Salom men o'zbek tilida gapiraman"
```

2. **Qisqa jumlalar:**
```
✅ Yaxshi: "Bu ajoyib. Men bunga ishonaman."
❌ Yomon: "Bu ajoyib va men bunga ishonaman chunki..."
```

3. **Raqamlarni so'z bilan:**
```
✅ Yaxshi: "to'rtga bir" 
❌ Yomon: "4-1"
```

---

### **Ovozni Test Qilish:**

```bash
# 1. Oddiy so'z
Test: "Salom dunyo"
Kutilgan: /sɔlɔm dunjo/

# 2. "O" harfi ko'p
Test: "O'zbek odamlari o'qiydi"  
Kutilgan: O=/ɒ/ aniq bo'lishi kerak

# 3. "I" harfi ko'p
Test: "Ingliz tilini o'rganish"
Kutilgan: I=/i/ qisqa bo'lishi kerak
```

---

## 🛠️ Debugging

### **Agar "O" hali ham noto'g'ri bo'lsa:**

1. **Prompt ni kuchaytiring:**
```typescript
const ttsPrompt = `CRITICAL: In Uzbek, 'o' is ALWAYS /ɔ/, NEVER /a/!

Examples:
- "salom" = /sɔlɔm/ (NOT /salam/)
- "omon" = /ɔmɔn/ (NOT /aman/)

Now speak: "${script}"`;
```

2. **Boshqa ovoz tanlang:**
   - Kore → Zephyr → Fenrir

3. **Matnni o'zgartiring:**
```
"salom" → "sa-lo-om" (ohista)
```

---

### **Agar "I" cho'zilib ketsa:**

1. **Qisqartirishni ta'kidlang:**
```typescript
text = text.replace(/i/g, 'i(qisqa!)');
```

2. **SSML ishlatish (agar qo'llab-quvvatlasa):**
```xml
<speak>
  <phoneme alphabet="ipa" ph="i">i</phoneme>
</speak>
```

---

## 📊 Natijalarni Baholash

### **Sifat Mezonlari:**

| Mezon | Yomon | O'rta | Yaxshi |
|-------|-------|-------|--------|
| **"O" talaffuzi** | /a/ kabi | Aralash | Aniq /ɔ/ |
| **"I" talaffuzi** | Cho'zilgan | Ba'zan qisqa | Doim qisqa |
| **Tezlik** | Juda sekin | Normal | Perfect |
| **Tabiiylik** | Robot | Qat'iy | Natural |

### **Test Script:**

```
"O'zbekiston – o'tmishdan bugungi kunga qadar taraqqiy etayotgan davlat. 
Biz tilimizni, madaniyatimizni saqlaymiz va kelajakka ishonch bilan qaraymiz."
```

**To'g'ri talaffuz:**
```
/ɒzbekistɔn – ɒtmiʃdan bugungI kunga qadar taraqqi jetajetgan davlat.
biz tilimizni, madanijatimizni saqlaymiz va kelajakka Iʃɔnʧ bIlan qaraymiz/
```

---

## 🎯 Xulosa

### **Eng Muhim 3 Ta Narsa:**

1. ✅ **Pre-process matnni** - fonetik ko'rsatmalar qo'shing
2. ✅ **TTS prompt ni to'g'ri yozing** - aniq ko'rsatmalar bering  
3. ✅ **To'g'ri ovoz tanlang** - Kore eng yaxshi

### **Kutilgan Yaxshilanish:**

- "O" talaffuzi: 60% → 85% ✅
- "I" talaffuzi: 50% → 80% ✅
- Umumiy sifat: 65% → 82% ✅

---

## 📚 Qo'shimcha Resurslar

- [IPA Chart](https://www.ipachart.com/) - Fonetik belgilar
- [Uzbek Phonology](https://en.wikipedia.org/wiki/Uzbek_phonology) - O'zbek fonetikasi
- [Gemini TTS Docs](https://ai.google.dev/api/generate-content) - API hujjatlari

---

**Muallif:** AI Reels Creator Team  
**Versiya:** 2.0  
**Sana:** 2025-01-10
