const express = require('express');
const cors = require('cors');
const path = require('path');
const { readFileSync } = require('fs');
require('dotenv').config();
const { resolveBotToken, buildTelegramApiUrl, getBotTokenDiagnostics } = require('./telegram-config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const BOT_TOKEN = resolveBotToken(process.env);
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

        const diagnostics = getBotTokenDiagnostics(process.env);
        const response = await fetch(buildTelegramApiUrl(BOT_TOKEN, 'getMe'));
        const data = await response.json();

        res.json({
            token_exists: diagnostics.token_exists,
            token_length: diagnostics.token_length,
            token_format_ok: diagnostics.token_format_ok,
            token_source: diagnostics.source,
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
            buildTelegramApiUrl(BOT_TOKEN, 'getChatMember'),
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

    const telegramUser = data.result.user;

    let profilePhotoUrl = null;

    try {

        const photoResponse = await fetch(
            buildTelegramApiUrl(BOT_TOKEN, 'getUserProfilePhotos'),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: telegramUser.id,
                    limit: 1
                })
            }
        );

        const photoData = await photoResponse.json();

        if (
            photoData.ok &&
            photoData.result.total_count > 0 &&
            photoData.result.photos.length > 0
        ) {

            const photoSizes = photoData.result.photos[0];

            // Largest available photo
            const largestPhoto = photoSizes[photoSizes.length - 1];

            const fileResponse = await fetch(
                buildTelegramApiUrl(BOT_TOKEN, 'getFile'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        file_id: largestPhoto.file_id
                    })
                }
            );

            const fileData = await fileResponse.json();

            if (fileData.ok) {

                profilePhotoUrl =
                    `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;

            }

        }

    } catch (photoError) {

        console.error('Profile photo error:', photoError);

    }

    return res.json({

        success: true,

        message: 'You are a verified member!',

        user: {

            id: telegramUser.id,

            username: telegramUser.username || null,

            firstName: telegramUser.first_name || '',

            lastName: telegramUser.last_name || '',

            profilePhotoUrl

        }

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

        console.error('BOT_TOKEN is missing or invalid. Set BOT_TOKEN (or TELEGRAM_BOT_TOKEN) before starting the bot.');

        return;

    }

    console.log('Telegram bot polling started with token source:', getBotTokenDiagnostics(process.env).source);

    while (true) {

        try {

            const response = await fetch(
                buildTelegramApiUrl(BOT_TOKEN, 'getUpdates', {
                    offset: lastUpdateId + 1,
                    timeout: 30
                })
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

                if (/^\/start(?:@[A-Za-z0-9_]+)?$/i.test(text)) {

                    const photoPath = path.join(__dirname, 'banner.png');
                    const caption = `<b>👋 Welcome to Rasel Enhancer!</b>\n\n<b>🆔 Your Telegram ID:</b> <code>${chatId}</code>`;
                    const imageBuffer = readFileSync(photoPath);
                    const imageBlob = new Blob([imageBuffer], { type: 'image/png' });
                    const formData = new FormData();
                    formData.append('chat_id', String(chatId));
                    formData.append('photo', imageBlob, 'banner.png');
                    formData.append('caption', caption);
                    formData.append('parse_mode', 'HTML');

                    try {

                        const photoResponse = await fetch(
                            buildTelegramApiUrl(BOT_TOKEN, 'sendPhoto'),
                            {
                                method: 'POST',
                                body: formData
                            }
                        );

                        const responseText = await photoResponse.text();
                        let photoData = null;

                        if (responseText) {
                            try {
                                photoData = JSON.parse(responseText);
                            } catch (parseError) {
                                console.error('Telegram /start sendPhoto returned invalid JSON:', {
                                    status: photoResponse.status,
                                    body: responseText,
                                    error: parseError.message
                                });
                            }
                        }

                        if (!photoResponse.ok || !photoData || !photoData.ok) {
                            console.error('Telegram /start sendPhoto failed:', {
                                status: photoResponse.status,
                                body: responseText,
                                parsed: photoData
                            });

                            await fetch(
                                buildTelegramApiUrl(BOT_TOKEN, 'sendMessage'),
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        chat_id: chatId,
                                        text: caption,
                                        parse_mode: 'HTML'
                                    })
                                }
                            );
                        }

                    } catch (error) {

                        console.error('Telegram /start error:', error);

                        await fetch(
                            buildTelegramApiUrl(BOT_TOKEN, 'sendMessage'),
                            {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    chat_id: chatId,
                                    text: caption
                                })
                            }
                        );

                    }

                }


                // ============================================
                // /check COMMAND
                // ============================================

                if (text === '/check') {

                    const memberResponse = await fetch(
                        buildTelegramApiUrl(BOT_TOKEN, 'getChatMember'),
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
`✅ <b>Verified!</b>

You are a member of <b>RASEL FF 148 😍</b>`;

                    } else {

                        reply =
`❌ <b>Not Verified!</b>

Please join the <b>RASEL FF 148</b> channel first.`;

                    }

                    await fetch(
                        buildTelegramApiUrl(BOT_TOKEN, 'sendMessage'),
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: reply,
                                parse_mode: 'HTML'
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
