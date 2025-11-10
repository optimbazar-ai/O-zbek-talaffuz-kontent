
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VoiceOption, TopicCategory } from "../types";
import { curatedViralTopics } from "../constants";

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("API Key topilmadi! .env.local faylida VITE_GEMINI_API_KEY ni sozlang.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || '' });

export async function generateScriptAndImagePrompt(
    topic: string, 
    useGoogleSearch: boolean
): Promise<{ script: string[]; imagePrompt: string; sources?: {uri: string, title: string}[], hashtags?: string[] }> {
  try {
    if (useGoogleSearch) {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Mavzu uchun kontent yarating: ${topic}`,
            config: {
                systemInstruction: `Siz yuqori malakali tahlilchi va fakt-chekersiz. Sizning vazifangiz - eng so'nggi ma'lumotlarga asoslanib, Instagram Reels uchun qisqa, ammo chuqur ma'noli ssenariylar yaratish. Ma'lumotlarni aniq, ishonchli va dalillarga asoslangan holda taqdim eting. "Bo'lishi mumkin", "ehtimol" kabi ikkilanishni bildiruvchi so'zlardan qoching. Javoblaringiz aqlli, ixcham va ekspert darajasida bo'lishi kerak.

Javobingizni quyidagi aniq formatda tuzing:
1. Birinchi navbatda, O'ZBEK TILIDA yozilgan, subtitrlar uchun mos keladigan qisqa jumlalarga bo'lingan ssenariy yozing. Har bir jumla yangi qatordan boshlansin. Umumiy so'zlar soni 100-150 orasida bo'lsin. Ssenariy oxirida tomoshabinlarni o‘z fikrini izohlarda qoldirishga va kanalga obuna bo‘lishga undaydigan qisqa da'vat qo'shing. **Muhim:** Agar mavzu sport, xususan futbol haqida bo'lsa, hisoblarni tabiiy va ravon tarzda ayting (masalan, "4-1" ni "to'rtga bir" deb, "1-1" ni "bir-bir durang" deb). Shuningdek, jamoa nomlarini to'liq yozing (masalan, "Borussiya Dortmund", "Manchester Yunayted"), qisqartmalardan saqlaning.
2. Keyin, yangi qatordan uchta defis yozing: ---
3. Uchta defisdan keyin, ssenariyni vizual tarzda ifodalovchi, rasm yaratish modeli uchun batafsil, yuqori sifatli, fotorealistik yoki kinematik tavsifni INGLIZ TILIDA yozing.
4. Yana yangi qatordan uchta defis yozing: ---
5. Va nihoyat, oxirgi uchta defisdan keyin, mavzuga oid 20 ta samarali va "ishlaydigan" heshteglarni vergul bilan ajratib yozing. Heshteglar umumiy (keng auditoriya uchun), mavzuga oid (o'rta) va maxsus (tor doiradagi) turlarni o'z ichiga olsin. (masalan: #uzbekistan, #faktlar, #koinot, #qiziqarli, #reelsuzb).

Javobingizda ssenariy, rasm tavsifi va heshteglardan boshqa hech qanday qo'shimcha matn, sarlavha yoki izoh bo'lmasligi SHART.`,
                tools: [{googleSearch: {}}],
            },
        });

        const responseText = response.text.trim();
        const parts = responseText.split('---');

        if (parts.length < 3 || !parts[0].trim() || !parts[1].trim() || !parts[2].trim()) {
            console.error("Noto'g'ri formatdagi javob:", responseText);
            throw new Error("Gemini'dan kutilgan formatda javob olinmadi. Model ssenariy, rasm tavsifi va heshteglarni to'g'ri ajratib bera olmadi.");
        }

        const script = parts[0].trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const imagePrompt = parts[1].trim();
        const hashtags = parts[2].split(',').map(h => h.trim().startsWith('#') ? h.trim() : `#${h.trim()}`).filter(h => h.length > 1);
        const result = { script, imagePrompt, hashtags };


        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        const sourceMap = new Map<string, { uri: string; title: string }>();
        if (Array.isArray(groundingChunks)) {
            for (const chunk of groundingChunks) {
                if (chunk?.web?.uri) {
                    if (!sourceMap.has(chunk.web.uri)) {
                        sourceMap.set(chunk.web.uri, {
                            uri: chunk.web.uri,
                            title: chunk.web.title || chunk.web.uri,
                        });
                    }
                }
            }
        }
        const uniqueSources = Array.from(sourceMap.values());

        return { ...result, sources: uniqueSources };

    } else {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Mavzu uchun kontent yarating: ${topic}`,
          config: {
            systemInstruction: `Siz o'z sohasining chuqur bilimdoni bo'lgan ekspert-kontent yaratuvchisiz. Sizning vazifangiz - berilgan mavzu bo'yicha Instagram Reels uchun qisqa, ammo ma'lumotga boy va aqlli ssenariylar yaratish. Ma'lumotlarni aniq va ishonchli tarzda taqdim eting. "Bo'lishi mumkin", "ehtimol" kabi taxminiy so'zlardan foydalanmang. Javobingiz ekspert nuqtai nazarini aks ettirsin.

Javobingiz uchta maydondan iborat JSON ob'ekti bo'lishi kerak:
1. "script": O'ZBEK TILIDA yozilgan ssenariy. Bu subtitrlar uchun mos bo'lishi kerak, shuning uchun uni qisqa, mantiqiy jumlalardan iborat string massivi sifatida tuzing. Ssenariy oxirida tomoshabinlarni o‘z fikrini izohlarda qoldirishga va kanalga obuna bo‘lishga undaydigan qisqa da'vat qo'shing. **Muhim:** Agar mavzu sport, xususan futbol haqida bo'lsa, hisoblarni tabiiy va ravon tarzda ayting (masalan, "4-1" ni "to'rtga bir" deb, "1-1" ni "bir-bir durang" deb). Shuningdek, jamoa nomlarini to'liq yozing (masalan, "Borussiya Dortmund", "Manchester Yunayted"), qisqartmalardan saqlaning.
2. "imagePrompt": Ssenariyni vizual tarzda ifodalovchi, rasm yaratish modeli uchun batafsil, yuqori sifatli, fotorealistik yoki kinematik tavsif. Bu tavsif ingliz tilida bo'lishi mumkin.
3. "hashtags": Mavzuga oid 20 ta samarali va "ishlaydigan" heshteglardan iborat string massivi. Heshteglar umumiy (keng auditoriya uchun), mavzuga oid (o'rta) va maxsus (tor doiradagi) turlarni o'z ichiga olsin. (masalan: ["#uzbekistan", "#faktlar", "#koinot", "#qiziqarli", "#reelsuzb"]).`,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                script: { type: Type.ARRAY, items: { type: Type.STRING } },
                imagePrompt: { type: Type.STRING },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["script", "imagePrompt", "hashtags"],
            },
          },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (result.script && result.imagePrompt && result.hashtags) {
          return result;
        } else {
          throw new Error("API'dan noto'g'ri JSON strukturasi qabul qilindi.");
        }
    }
  } catch (error) {
    console.error("Ssenariy va tavsif yaratishda xato:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Gemini'dan qaytgan javobni JSON formatida o'qib bo'lmadi. Boshqa mavzu bilan urinib ko'ring.");
    }
    if (error instanceof Error && error.message) {
        throw error;
    }
    throw new Error("Gemini'dan ssenariy va tavsif yaratib bo'lmadi.");
  }
}

export async function generateImage(prompt: string, overrideQuery?: string): Promise<string[]> {
    try {
        const baseQuery = overrideQuery && overrideQuery.trim().length > 0
            ? overrideQuery.trim()
            : prompt;

        // Extract key search terms from the prompt or override (English keywords work best)
        const keywords = baseQuery.split(/[,.\s]+/)
            .filter(w => w.length > 2)
            .slice(0, 8)
            .join(' ');
        const searchQuery = encodeURIComponent(keywords || 'nature landscape');
        
        console.log('Searching for images with keywords:', keywords);
        
        // Use Pexels API for topic-relevant images
        const PEXELS_API_KEY = '563492ad6f91700001000001c69e2c70104b40298c1a5f26edc22c47';
        const imagePromises = [];
        
        for (let i = 0; i < 4; i++) {
            // Each request gets a different page to get varied images
            const page = i + 1;
            const pexelsUrl = `https://api.pexels.com/v1/search?query=${searchQuery}&orientation=portrait&per_page=1&page=${page}`;
            
            imagePromises.push(
                fetch(pexelsUrl, {
                    headers: { 'Authorization': PEXELS_API_KEY }
                })
                .then(async response => {
                    if (!response.ok) {
                        throw new Error(`Pexels API error: ${response.status}`);
                    }
                    const data = await response.json();
                    
                    if (data.photos && data.photos.length > 0) {
                        // Use large size for better quality
                        const imageUrl = data.photos[0].src.large;
                        console.log(`Image ${i + 1} found:`, data.photos[0].alt || imageUrl);
                        
                        // Fetch and convert to base64
                        const imgResponse = await fetch(imageUrl);
                        const blob = await imgResponse.blob();
                        const buffer = await blob.arrayBuffer();
                        const base64 = btoa(
                            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                        );
                        return `data:image/jpeg;base64,${base64}`;
                    } else {
                        throw new Error('No photos found');
                    }
                })
                .catch(error => {
                    console.warn(`Pexels rasm ${i + 1} yuklanmadi:`, error.message);
                    // Fallback to Picsum for this image
                    return fetch(`https://picsum.photos/600/1067?random=${Date.now()}_${i}`)
                        .then(async resp => {
                            if (!resp.ok) throw new Error('Picsum failed');
                            const blob = await resp.blob();
                            const buffer = await blob.arrayBuffer();
                            const base64 = btoa(
                                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                            );
                            return `data:image/jpeg;base64,${base64}`;
                        })
                        .catch(() => {
                            console.warn(`Gradient yaratilmoqda rasm ${i + 1} uchun`);
                            return `data:image/jpeg;base64,${createGradientPlaceholder(prompt, i)}`;
                        });
                })
            );
            
            // Small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        const images = await Promise.all(imagePromises);
        console.log('All images loaded successfully:', images.length);
        return images;
    } catch (error) {
        console.error("Rasmlar yaratishda xato:", error);
        // Fallback: return 4 gradient images
        return [
            `data:image/jpeg;base64,${createGradientPlaceholder(prompt, 0)}`,
            `data:image/jpeg;base64,${createGradientPlaceholder(prompt, 1)}`,
            `data:image/jpeg;base64,${createGradientPlaceholder(prompt, 2)}`,
            `data:image/jpeg;base64,${createGradientPlaceholder(prompt, 3)}`,
        ];
    }
}

// Helper function to create a gradient placeholder image
function createGradientPlaceholder(prompt: string, index: number = 0): string {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 1067;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Canvas yaratib bo\'lmadi');
    }
    
    // Create gradient based on prompt hash and index
    const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#30cfd0', '#330867'],
    ];
    const colorPair = colors[(hash + index) % colors.length];
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 1067);
    gradient.addColorStop(0, colorPair[0]);
    gradient.addColorStop(1, colorPair[1]);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 1067);
    
    // Add text overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text
    const maxWidth = 500;
    const words = prompt.split(' ');
    let line = '';
    let y = 533;
    
    ctx.fillText('AI Reels', 300, y - 100);
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
            ctx.fillText(line, 300, y);
            line = words[i] + ' ';
            y += 60;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, 300, y);
    
    // Convert to base64
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    return dataUrl.split(',')[1];
}

// O'zbek talaffuzini yaxshilash uchun matnni tayyorlash
function preprocessUzbekText(text: string): string {
    let processed = text;
    
    // 1. "o" harfini to'g'ri talaffuz qilish uchun
    // "o" oldiga fonetik ko'rsatma qo'shamiz
    processed = processed.replace(/\bo\b/gi, 'o (o harfini aniq o kabi ayt)');
    processed = processed.replace(/([^aeiouąęėįųūо])o([^aeiouąęėįųūо])/gi, '$1o(aniq o)$2');
    
    // 2. "i" harfini qisqa talaffuz qilish uchun
    // Cho'zilmasligi kerak bo'lgan joylarda
    processed = processed.replace(/\bi\b/gi, 'i (qisqa i)');
    processed = processed.replace(/([^aeiouąęėįųūо])i([^aeiouąęėįųūо])/gi, '$1i(qisqa)$2');
    
    // 3. O'zbek-spetsifik tovushlar uchun ko'rsatmalar
    processed = processed.replace(/oʻ/g, 'o\'(katta o)');
    processed = processed.replace(/gʻ/g, 'g\'(yumshoq g)');
    
    return processed;
}

// TTS uchun maxsus prompt yaratish
function createUzbekTTSPrompt(script: string): string {
    const preprocessed = preprocessUzbekText(script);
    
    return `You are speaking in Uzbek language. Follow these pronunciation rules strictly:

1. VOWEL 'O': Pronounce as /ɔ/ (open back rounded vowel), NOT as 'a'. Think of English "caught" or Russian "кот".
2. VOWEL 'I': Pronounce as short /i/ (close front unrounded vowel), like English "bit" NOT "beat". Keep it SHORT.
3. SPEED: Speak at normal pace, not too slow.
4. STRESS: Natural Uzbek stress patterns - typically on the last syllable.
5. CONSONANTS: Clear and distinct, especially:
   - Q: uvular /q/ sound
   - G': soft /ɣ/ sound
   - O': back /ɒ/ sound

Text to speak:
"${preprocessed}"

Remember: 'o' = /ɔ/ (open O), 'i' = /i/ (short I).`;
}

export async function generateAudio(script: string, voice: VoiceOption): Promise<string> {
    try {
        // O'zbek talaffuzi uchun maxsus prompt
        const ttsPrompt = createUzbekTTSPrompt(script);
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: ttsPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (audioData) {
            return audioData;
        } else {
            throw new Error("Javobda audio ma'lumotlar olinmadi.");
        }
    } catch(error) {
        console.error("Audio yaratishda xato:", error);
        throw new Error("TTS modelidan audio yaratib bo'lmadi.");
    }
}


// Helper function to parse model's text response into a string array
async function parseTopicsJsonResponse(responseText: string): Promise<string[]> {
    let jsonString = responseText.trim();
    // Clean up potential markdown code blocks
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }

    const topics = JSON.parse(jsonString);

    if (Array.isArray(topics) && topics.length > 0 && topics.every(t => typeof t === 'string')) {
      return topics;
    } else {
      throw new Error("API'dan mavzular ro'yxati olinmadi yoki format noto'g'ri.");
    }
}


// Generates 10 topics based on current events using Google Search
async function generateTodaysTopics(): Promise<string[]> {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Bugungi kunga oid 10 ta dolzarb Instagram Reels mavzularini yarating. Ro'yxatda bugun bo'lib o'tadigan futbol o'yinlari va O'zbekistondagi eng so'nggi yangiliklar kabi mavzular bo'lishi shart.",
      config: {
        systemInstruction: `Siz O'zbekiston media makonidagi eng so'nggi voqealardan xabardor bo'lgan trend tahlilchisisiz. Sizning vazifangiz - bugungi kunga oid, jumladan, sport (masalan, bugungi futbol o'yinlari) va mahalliy yangiliklarni o'z ichiga olgan 10 ta dolzarb va qiziqarli mavzular ro'yxatini yaratish. Javobingizni faqat JSON formatidagi string massivi ko'rinishida taqdim eting. Masalan: ["mavzu 1", "mavzu 2", ...]. Javobingizda JSON massividan boshqa hech qanday matn, izoh yoki sarlavha bo'lmasligi shart.`,
        tools: [{googleSearch: {}}],
      },
    });
    return parseTopicsJsonResponse(response.text);
}

// Generates 20 general/viral topics without Google Search
async function generateGeneralViralTopics(): Promise<string[]> {
     const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Instagram Reels uchun O'zbekiston auditoriyasiga mo'ljallangan 20 ta umumiy, doimiy dolzarb (evergreen) va virusli mavzular ro'yxatini yarating.",
        config: {
            systemInstruction: `Siz tajribali ijtimoiy media marketologsiz. Sizning vazifangiz - Instagram Reels uchun keng auditoriyani qamrab oladigan va yuqori jalb etish potentsialiga ega bo'lgan 20 ta mavzu g'oyasini taklif qilish. Javobingizni faqat JSON formatidagi string massivi ko'rinishida taqdim eting. Masalan: ["mavzu 1", "mavzu 2", ...]. Javobingizda JSON massividan boshqa hech qanday matn, izoh yoki sarlavha bo'lmasligi SHART.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            },
        },
    });
    // The response is already JSON, so we just need to parse it.
    const topics = JSON.parse(response.text.trim());
    if (Array.isArray(topics) && topics.length > 0 && topics.every(t => typeof t === 'string')) {
        return topics;
    }
    throw new Error("Umumiy mavzular uchun kutilgan formatda javob olinmadi.");
}

export async function generateTrendingTopics(): Promise<TopicCategory[]> {
  try {
    // Run both topic generation requests in parallel
    const [todaysResult, generalResult] = await Promise.allSettled([
        generateTodaysTopics(),
        generateGeneralViralTopics(),
    ]);

    let allTopicCategories: TopicCategory[] = [];
    
    // Add today's topics first to show them at the top
    if (todaysResult.status === 'fulfilled' && todaysResult.value.length > 0) {
        allTopicCategories.push({
            category: '🔥 Bugungi dolzarb mavzular',
            topics: todaysResult.value,
        });
    } else if (todaysResult.status === 'rejected') {
        console.warn("Bugungi mavzularni yaratishda xato:", todaysResult.reason);
    }

    // Add general topics
    if (generalResult.status === 'fulfilled' && generalResult.value.length > 0) {
        allTopicCategories.push({
            category: '📈 Umumiy trendlar',
            topics: generalResult.value,
        });
    } else if (generalResult.status === 'rejected') {
        console.warn("Umumiy mavzularni yaratishda xato:", generalResult.reason);
    }
    
    // Add the curated list of topics
    allTopicCategories = allTopicCategories.concat(curatedViralTopics);

    if (allTopicCategories.flatMap(c => c.topics).length === 0) {
        throw new Error("Mavzularni yuklab bo'lmadi. Iltimos, qayta urinib ko'ring.");
    }
    
    return allTopicCategories;

  } catch (error) {
    console.error("Trenddagi mavzularni yaratishda umumiy xato:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Gemini'dan qaytgan javobni JSON formatida o'qib bo'lmadi.");
    }
    if (error instanceof Error && error.message) {
        throw error;
    }
    throw new Error("Gemini'dan trenddagi mavzularni olib bo'lmadi.");
  }
}