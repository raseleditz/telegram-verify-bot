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

app.post('/verify', async (req, res) => {

    const { userId } = req.body;

    if (!userId) {
        return res.json({
            success: false,
            message: 'Telegram ID is required'
        });
    }

    try {

        const url =
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember` +
            `?chat_id=${CHANNEL_ID}&user_id=${userId}`;

        console.log('Checking URL:', url.replace(BOT_TOKEN, 'TOKEN_HIDDEN'));

        const response = await fetch(url);
        const data = await response.json();

        console.log('Telegram response:', data);

        if (!data.ok) {
            return res.json({
                success: false,
                message: data.description || 'Telegram API error'
            });
        }

        const status = data.result.status;

        if (
            status === 'member' ||
            status === 'administrator' ||
            status === 'creator'
        ) {
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verification server running on port ${PORT}`);
});
