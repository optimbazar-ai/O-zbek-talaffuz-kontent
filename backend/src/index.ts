import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { generateDailyContent } from './services/contentGenerator.js';
import { postToInstagram } from './services/instagramService.js';
import { connectDatabase, isMongoConnected } from './database/connection.js';
import { Post } from './models/Post.js';
import { logger } from './utils/logger.js';

dotenv.config();

if (!process.env.TELEGRAM_BOT_TOKEN) {
  logger.error('❌ TELEGRAM_BOT_TOKEN not set in .env file');
  process.exit(1);
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

interface MyContext extends Context {
  session?: {
    userId?: number;
    username?: string;
  };
}

// Bot commands
bot.start((ctx: MyContext) => {
  ctx.reply(`
🤖 Salom! Men O'zbek Content Bot-man.

📋 Mening xizmatlarim:
/generate - 10 ta rasm generatsiya qilish
/schedule - Avtomatik posting sozlash
/status - Holat ko'rish
/help - Yordam

💡 Har kuni 10 ta rasm avtomatik generatsiya qilinadi va Telegram'ga yuboriladi.
Siz ularni Instagram'ga qo'lda joylashingiz mumkin.
  `);
});

bot.command('generate', async (ctx: MyContext) => {
  try {
    ctx.reply('⏳ 10 ta rasm generatsiya qilinmoqda... Iltimos, kuting.');
    
    const userId = ctx.from?.id || 0;
    const username = ctx.from?.username || 'unknown';
    
    // Generate content
    const content = await generateDailyContent();
    
    if (!content || content.length === 0) {
      ctx.reply('❌ Rasm generatsiya qilishda xato yuz berdi.');
      return;
    }
    
    // Save to database (if MongoDB connected)
    let postId = 'local-' + Date.now();
    if (isMongoConnected()) {
      try {
        const post = new Post({
          userId,
          username,
          content,
          status: 'generated',
          createdAt: new Date(),
        });
        await post.save();
        postId = post._id?.toString() || postId;
      } catch (dbError) {
        logger.warn('Could not save to database:', dbError);
      }
    }
    
    // Send images to Telegram
    ctx.reply('📸 Rasmlar yuborilmoqda...');
    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      try {
        await ctx.replyWithPhoto(
          { url: item.imageUrl },
          {
            caption: `📸 Rasm ${i + 1}/${content.length}\n\n${item.script.join('\n')}\n\n${item.hashtags.join(' ')}`,
          }
        );
      } catch (photoError) {
        logger.warn(`Could not send photo ${i + 1}:`, photoError);
        ctx.reply(`⚠️ Rasm ${i + 1} yuborilmadi`);
      }
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    ctx.reply(`✅ 10 ta rasm tayyor! Post ID: ${postId}`);
    logger.info(`Generated 10 images for user ${username}`);
    
  } catch (error) {
    logger.error('Generate command error:', error);
    ctx.reply('❌ Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.');
  }
});

bot.command('schedule', async (ctx: MyContext) => {
  try {
    const userId = ctx.from?.id || 0;
    const username = ctx.from?.username || 'unknown';
    
    ctx.reply(`
📅 Avtomatik posting sozlandi!

⏰ Har kuni 09:00 da:
- 10 ta rasm generatsiya qilinadi
- Telegram'ga yuboriladi
- Siz Instagram'ga joylashingiz mumkin

Keyingi generatsiya: Ertaga 09:00 da
    `);
    
    logger.info(`Scheduled daily content for user ${username}`);
    
  } catch (error) {
    logger.error('Schedule command error:', error);
    ctx.reply('❌ Xatolik yuz berdi.');
  }
});

bot.command('status', async (ctx: MyContext) => {
  try {
    if (!isMongoConnected()) {
      ctx.reply('📊 Database ulanmagan. Hali post yo\'q.');
      return;
    }
    
    const userId = ctx.from?.id || 0;
    try {
      const recentPosts = await Post.find({ userId }).sort({ createdAt: -1 }).limit(5);
      
      if (recentPosts.length === 0) {
        ctx.reply('📊 Hali post yo\'q.');
        return;
      }
      
      let statusText = '📊 Oxirgi postlar:\n\n';
      recentPosts.forEach((post, index) => {
        statusText += `${index + 1}. ${post.createdAt.toLocaleDateString('uz-UZ')} - ${post.status}\n`;
      });
      
      ctx.reply(statusText);
    } catch (dbError) {
      logger.warn('Could not fetch posts:', dbError);
      ctx.reply("📊 Database'dan ma'lumot olib bo'lmadi.");
    }
    
  } catch (error) {
    logger.error('Status command error:', error);
    ctx.reply('❌ Xatolik yuz berdi.');
  }
});

bot.command('help', (ctx: MyContext) => {
  ctx.reply(`
📖 Yordam:

/generate - Darhol 10 ta rasm generatsiya qilish
/schedule - Avtomatik posting sozlash
/status - Oxirgi postlarni ko'rish
/help - Bu xabar

💡 Maslahat:
- Har kuni 09:00 da avtomatik generatsiya
- Rasmlarni Telegram'dan Instagram'ga ko'chiring
- Har bir rasm uchun caption allaqachon tayyor
  `);
});

// Cron job: Generate content daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  try {
    logger.info('🤖 Daily content generation started');
    
    const content = await generateDailyContent();
    
    if (!content || content.length === 0) {
      logger.error('Failed to generate daily content');
      return;
    }
    
    // Save to database
    const post = new Post({
      userId: 0,
      username: 'system',
      content,
      status: 'generated',
      createdAt: new Date(),
    });
    
    await post.save();
    
    logger.info(`✅ Daily content generated: ${content.length} images`);
    
    // Optionally: Post to Instagram automatically
    // await postToInstagram(content);
    
  } catch (error) {
    logger.error('Daily cron job error:', error);
  }
});

// Start bot
async function start() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('✅ Database connected');
    
    // Launch bot
    await bot.launch();
    logger.info('✅ Telegram bot started');
    
    // Graceful shutdown
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
    
  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

start();
