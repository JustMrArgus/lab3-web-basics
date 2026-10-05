// Лабораторна робота №3. Telegram-бот з меню та запитом до AI
// Виконав: ст. Родіна О.В., гр. ІМ-33, варіант 15
require('dotenv').config({ quiet: true });

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,          // токен від @BotFather
  GROQ_API_KEY: process.env.GROQ_API_KEY,    // ключ з console.groq.com/keys
  GROQ_MODEL: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  WEBHOOK_URL: process.env.WEBHOOK_URL,      // адреса сервера після деплою (якщо порожня — polling)
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'lab3-im33-secret',
  PORT: process.env.PORT || 3000,

  STUDENT: {
    name: 'Родіна Олександр Вікторович',
    group: 'ІМ-33',
    variant: 15,
    faculty: 'ФІОТ, КПІ ім. Ігоря Сікорського',
    phone: process.env.STUDENT_PHONE || '+380 XX XXX XX XX',
    email: process.env.STUDENT_EMAIL || 'student@example.com',
    telegram: process.env.STUDENT_TELEGRAM || '@username',
  },
};
