const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = '-1001882613037';


// ============================================
// HOME ROUTE
// ============================================

app.get('/', (req, res) => {
    res.send('Telegram Verification Server is Running!');
});


// ============================================
// DEBUG ROUTE
// ============================================

app.get('/debug', async (req, res) => {

    try {

        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getMe`
        );

        const data = await response.json();

        res.json({
            token_exists: !!BOT_TOKEN,
            token_length: BOT_TOKEN ? BOT_TOKEN.length : 0,
            token_last_6: BOT_TOKEN ? BOT_TOKEN.slice(-6) : null,
            telegram_response: data
        });

    } catch (error) {

        res.json({
            error: error.message
        });

    }

});


// ============================================
// WEBSITE TELEGRAM MEMBERSHIP VERIFICATION
// ============================================

app.post('/verify', async (req, res) => {

    const { userId } = req.body;

    if (!userId) {

        return res.json({
            success: false,
            message: 'Telegram ID is required'
        });

    }

    try {

        const response = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: CHANNEL_ID,
                    user_id: Number(userId)
                })
            }
        );

        const data = await response.json();

        console.log('Telegram API Response:', data);

        if (!data.ok) {

            return res.json({
                success: false,
                message: data.description || 'Telegram API error'
            });

        }

        const status = data.result.status;

        const isMember =
            status === 'member' ||
            status === 'administrator' ||
            status === 'creator';

        if (isMember) {

            return res.json({
                success: true,
                message: 'You are a verified member!'
            });

        }

        return res.json({
            success: false,
            message: 'You must join the channel first.'
        });

    } catch (error) {

        console.error('Telegram API Error:', error);

        return res.json({
            success: false,
            message: 'Verification failed.'
        });

    }

});


// ============================================
// TELEGRAM BOT POLLING
// ============================================

let lastUpdateId = 0;

async function startTelegramBot() {

    if (!BOT_TOKEN) {

        console.error('BOT_TOKEN is missing!');

        return;

    }

    console.log('Telegram bot polling started...');

    while (true) {

        try {

            const response = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`
            );

            const data = await response.json();

            if (!data.ok) {

                console.error('Telegram Bot Error:', data);

                await new Promise(resolve => setTimeout(resolve, 5000));

                continue;

            }

            for (const update of data.result) {

                lastUpdateId = update.update_id;

                if (!update.message) continue;

                const chatId = update.message.chat.id;
                const text = update.message.text || '';


                // ============================================
                // /start COMMAND
                // ============================================

                if (text === '/start') {

                    await fetch(
                        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text:
`👋 Welcome to Rasel Checker!

🆔 Your Telegram ID:

${chatId}

এই ID টি website verification-এর জন্য ব্যবহার করুন।`
                            })
                        }
                    );

                }


                // ============================================
                // /check COMMAND
                // ============================================

                if (text === '/check') {

                    const memberResponse = await fetch(
                        `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                chat_id: CHANNEL_ID,
                                user_id: chatId
                            })
                        }
                    );

                    const memberData = await memberResponse.json();

                    let reply;

                    if (
                        memberData.ok &&
                        (
                            memberData.result.status === 'member' ||
                            memberData.result.status === 'administrator' ||
                            memberData.result.status === 'creator'
                        )
                    ) {

                        reply =
`✅ Verified!

You are a member of RASEL FF 148 😍`;

                    } else {

                        reply =
`❌ Not Verified!

Please join the RASEL FF 148 channel first.`;

                    }

                    await fetch(
                        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: reply
                            })
                        }
                    );

                }

            }

        } catch (error) {

            console.error('Bot polling error:', error);

            await new Promise(resolve => setTimeout(resolve, 5000));

        }

    }

}


// ============================================
// START TELEGRAM BOT
// ============================================

startTelegramBot();


// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {

    console.log(`Verification server running on port ${PORT}`);

});
