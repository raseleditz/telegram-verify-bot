const { TelegramBot } = require('node-telegram-bot-api');
require('dotenv').config();
const { resolveBotToken, buildTelegramApiUrl } = require('./telegram-config');

const BOT_TOKEN = resolveBotToken(process.env);

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is missing. Please set BOT_TOKEN or TELEGRAM_BOT_TOKEN before starting the bot.');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, {
    polling: true
});

console.log('Bot is running...');

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || 'there';

    bot.sendMessage(
        chatId,
        `Hello ${firstName}! 👋\n\n` +
        `Your Telegram ID is:\n\n` +
        `${userId}\n\n` +
        `Copy this ID and paste it on the website.`
    );
});

const CHANNEL_ID = '-1001882613037';

bot.onText(/\/check (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];

    try {
        const member = await bot.getChatMember(
            CHANNEL_ID,
            userId
        );

        const status = member.status;

        if (
            status === 'member' ||
            status === 'administrator' ||
            status === 'creator'
        ) {
            bot.sendMessage(
                chatId,
                '✅ You are a verified member!'
            );
        } else {
            bot.sendMessage(
                chatId,
                '❌ You are not a member of the channel.'
            );
        }

    } catch (error) {
        console.log(error.message);

        bot.sendMessage(
            chatId,
            '⚠️ Could not verify this Telegram ID.'
        );
    }
});