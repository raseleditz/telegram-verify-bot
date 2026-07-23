const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Telegram Verification Server is Running!');
});

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = '-1001882613037';


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
// TELEGRAM MEMBERSHIP VERIFICATION
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
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verification server running on port ${PORT}`);
});
