// Точка входу: локально — long polling, на сервері — webhook
const express = require('express');
const { webhookCallback } = require('grammy');
const { BOT_TOKEN, WEBHOOK_URL, WEBHOOK_SECRET, PORT } = require('./config');
const { createBot } = require('./bot');

if (!BOT_TOKEN) {
  console.error('Не задано BOT_TOKEN. Створіть файл .env (див. .env.example)');
  process.exit(1);
}

const bot = createBot(BOT_TOKEN);

async function main() {
  // Команди, що відображаються в меню "/" у Telegram
  await bot.api.setMyCommands([
    { command: 'start', description: 'Головне меню' },
    { command: 'help', description: 'Довідка' },
    { command: 'reset', description: 'Нова розмова з AI' },
  ]);

  if (WEBHOOK_URL) {
    // Режим webhook (Render): Telegram сам надсилає оновлення на наш сервер
    const app = express();
    app.use(express.json());
    app.get('/', (req, res) => res.send('Telegram bot Rodina IM-33 is running'));
    app.post('/webhook', webhookCallback(bot, 'express', { secretToken: WEBHOOK_SECRET }));
    app.listen(PORT, async () => {
      await bot.api.setWebhook(`${WEBHOOK_URL}/webhook`, { secret_token: WEBHOOK_SECRET });
      console.log(`Webhook встановлено: ${WEBHOOK_URL}/webhook (порт ${PORT})`);
    });
  } else {
    // Режим long polling (локальний запуск)
    await bot.api.deleteWebhook();
    bot.start({ onStart: (me) => console.log(`Бот @${me.username} запущено (polling)`) });
    app.listen(PORT, async () => {
      console.log(`Слухаю сервер (порт ${PORT})`);
    });
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
