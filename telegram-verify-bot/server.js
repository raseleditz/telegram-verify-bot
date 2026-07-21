const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:8000'
}));

app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_USERNAME = '@raselff148';

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
            `?chat_id=${CHANNEL_USERNAME}&user_id=${userId}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.ok) {
            return res.json({
                success: false,
                message: 'Invalid Telegram ID or user not found.'
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

app.listen(PORT, () => {
    console.log(`Verification server running at http://localhost:${PORT}`);
});