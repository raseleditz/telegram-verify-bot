function normalizeBotToken(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\s+/g, '');
}

function resolveBotToken(env = process.env) {
  const candidates = [
    env.BOT_TOKEN,
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_TOKEN
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBotToken(candidate);

    if (normalized) {
      return normalized;
    }
  }

  return '';
}

function buildTelegramApiUrl(token, method, params = {}) {
  const normalizedToken = normalizeBotToken(token);
  const url = new URL(`https://api.telegram.org/bot${normalizedToken}/${method}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function getBotTokenDiagnostics(env = process.env) {
  const token = resolveBotToken(env);

  return {
    source: env.BOT_TOKEN ? 'BOT_TOKEN' : (env.TELEGRAM_BOT_TOKEN ? 'TELEGRAM_BOT_TOKEN' : (env.TELEGRAM_TOKEN ? 'TELEGRAM_TOKEN' : 'none')),
    token_exists: Boolean(token),
    token_length: token.length,
    token_format_ok: /^[0-9]+:[A-Za-z0-9_-]+$/.test(token)
  };
}

module.exports = {
  normalizeBotToken,
  resolveBotToken,
  buildTelegramApiUrl,
  getBotTokenDiagnostics
};
