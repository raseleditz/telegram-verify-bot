const { TelegramBot } = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
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

const CHANNEL_USERNAME = '@raselff148';

bot.onText(/\/check (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = match[1];

    try {
        const member = await bot.getChatMember(
            CHANNEL_USERNAME,
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