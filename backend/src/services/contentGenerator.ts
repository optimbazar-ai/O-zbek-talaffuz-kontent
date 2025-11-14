import axios from 'axios';
import { logger } from '../utils/logger.js';

interface ContentItem {
  script: string[];
  imageUrl: string;
  imagePrompt: string;
  hashtags: string[];
}

// Gemini API orqali rasm generatsiya qilish
async function generateImageWithGemini(prompt: string): Promise<string> {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Yuqori sifatli, fotorealistik rasm yarating. Mavzu: "${prompt}". Rasm portrait orientatsiyada (600x1067 piksel) bo'lishi kerak.`
          }]
        }],
        generationConfig: {
          outputMimeType: 'image/jpeg'
        }
      }
    );

    const imageData = response.data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (imageData) {
      return `data:image/jpeg;base64,${imageData}`;
    }
    throw new Error('No image data in response');
  } catch (error) {
    logger.error('Error generating image with Gemini:', error);
    throw error;
  }
}

// Gemini API orqali ssenariy va tavsif generatsiya qilish
async function generateScriptAndPrompt(topic: string): Promise<{
  script: string[];
  imagePrompt: string;
  hashtags: string[];
}> {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Mavzu uchun kontent yarating: ${topic}`
          }]
        }],
        generationConfig: {
          responseSchema: {
            type: 'OBJECT',
            properties: {
              script: { type: 'ARRAY', items: { type: 'STRING' } },
              imagePrompt: { type: 'STRING' },
              hashtags: { type: 'ARRAY', items: { type: 'STRING' } }
            },
            required: ['script', 'imagePrompt', 'hashtags']
          },
          responseMimeType: 'application/json'
        }
      }
    );

    const result = JSON.parse(response.data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
    return result;
  } catch (error) {
    logger.error('Error generating script and prompt:', error);
    throw error;
  }
}

// Har kuni 10 ta rasm generatsiya qilish
export async function generateDailyContent(): Promise<ContentItem[]> {
  try {
    const topics = [
      'O\'zbekiston tarixiy joylar',
      'Samarqand Registan',
      'Buxoro qadimiy shahar',
      'Xiva qalasi',
      'Toshkent moderni shahar',
      'O\'zbek milliy taomlar',
      'O\'zbek san\'ati va hunarmandchiligi',
      'Aral dengizi tarixchasi',
      'O\'zbek tilining xususiyatlari',
      'Qo\'qon qalasi'
    ];

    const content: ContentItem[] = [];

    for (let i = 0; i < topics.length; i++) {
      try {
        logger.info(`Generating content for topic: ${topics[i]}`);

        // Generate script and image prompt
        const scriptData = await generateScriptAndPrompt(topics[i]);

        // Generate image
        const imageUrl = await generateImageWithGemini(scriptData.imagePrompt);

        content.push({
          script: scriptData.script,
          imageUrl,
          imagePrompt: scriptData.imagePrompt,
          hashtags: scriptData.hashtags
        });

        // Delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        logger.error(`Error generating content for topic ${topics[i]}:`, error);
        // Continue with next topic
      }
    }

    logger.info(`Generated ${content.length} content items`);
    return content;

  } catch (error) {
    logger.error('Error in generateDailyContent:', error);
    throw error;
  }
}

// Mavzularning ro'yxatini olish
export async function getTrendingTopics(): Promise<string[]> {
  const topics = [
    'O\'zbekiston tarixiy joylar',
    'Samarqand Registan',
    'Buxoro qadimiy shahar',
    'Xiva qalasi',
    'Toshkent moderni shahar',
    'O\'zbek milliy taomlar',
    'O\'zbek san\'ati va hunarmandchiligi',
    'Aral dengizi tarixchasi',
    'O\'zbek tilining xususiyatlari',
    'Qo\'qon qalasi'
  ];
  return topics;
}
