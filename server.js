const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

        // Telegram API error
        if (!data.ok) {
            console.error('Telegram API Error:', data);

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verification server running on port ${PORT}`);
});
