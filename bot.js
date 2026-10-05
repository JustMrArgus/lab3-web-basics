// Логіка бота: меню, обробники кнопок, режим Prompt AI
const { Bot, Keyboard, InlineKeyboard } = require('grammy');
const { STUDENT } = require('./config');
const { askAI } = require('./ai');

const BTN = {
  student: '👨‍🎓 Студент',
  it: '💻 IT-технології',
  contacts: '📞 Контакти',
  ai: '🤖 Prompt AI',
};

// Головне меню (reply-клавіатура під полем введення)
const mainMenu = new Keyboard()
  .text(BTN.student).text(BTN.it).row()
  .text(BTN.contacts).text(BTN.ai)
  .resized();

// Підменю IT-технологій (inline-кнопки)
const TECH = {
  node: ['Node.js + Express', 'Серверний JavaScript. Express — мінімалістичний веб-фреймворк для створення HTTP-серверів та REST API.'],
  ws: ['WebSocket / Socket.IO', 'Протокол постійного двонаправленого з’єднання. Використано в ЛР1 для чату в реальному часі.'],
  jwt: ['JWT', 'JSON Web Token — підписаний токен для авторизації. Використано в ЛР2 разом з bcrypt та ролями user/admin.'],
  tg: ['Telegram Bot API', 'HTTP API для створення ботів. Бот отримує оновлення через long polling або webhook. Бібліотека — grammY.'],
  ai: ['AI / LLM', 'Великі мовні моделі. Бот звертається до безкоштовного Groq API (OpenAI-сумісний інтерфейс).'],
  deploy: ['Хмарний деплой', 'Бот розгорнуто на Render: сервер Express приймає оновлення від Telegram через webhook.'],
};
const techMenu = Object.entries(TECH).reduce(
  (kb, [key, [title]], i) => (i % 2 ? kb.text(title, `tech:${key}`).row() : kb.text(title, `tech:${key}`)),
  new InlineKeyboard(),
);

function createBot(token, botConfig) {
  const bot = new Bot(token, botConfig);

  // Стан користувачів: чи увімкнено режим AI та історія діалогу
  const sessions = new Map();
  const getSession = (id) => {
    if (!sessions.has(id)) sessions.set(id, { aiMode: false, history: [] });
    return sessions.get(id);
  };

  bot.command('start', (ctx) => {
    getSession(ctx.chat.id).aiMode = false;
    return ctx.reply(
      `Привіт, ${ctx.from.first_name}! 👋\n` +
      `Це бот студента ${STUDENT.name}, група ${STUDENT.group}.\n` +
      'Оберіть пункт меню нижче.',
      { reply_markup: mainMenu },
    );
  });

  bot.command('help', (ctx) => ctx.reply(
    'Команди:\n/start — головне меню\n/help — довідка\n/reset — очистити історію діалогу з AI\n\n' +
    `У режимі «${BTN.ai}» будь-яке повідомлення надсилається до AI.`,
    { reply_markup: mainMenu },
  ));

  bot.command('reset', (ctx) => {
    getSession(ctx.chat.id).history = [];
    return ctx.reply('🧹 Історію діалогу з AI очищено.');
  });

  bot.hears(BTN.student, (ctx) => {
    getSession(ctx.chat.id).aiMode = false;
    return ctx.reply(
      '👨‍🎓 Студент\n\n' +
      `ПІБ: ${STUDENT.name}\nГрупа: ${STUDENT.group}\nВаріант: ${STUDENT.variant}\n${STUDENT.faculty}`,
    );
  });

  bot.hears(BTN.it, (ctx) => {
    getSession(ctx.chat.id).aiMode = false;
    return ctx.reply('💻 IT-технології, які я вивчаю в курсі «Основи WEB-технологій».\nОберіть технологію:',
      { reply_markup: techMenu });
  });

  bot.callbackQuery(/^tech:(\w+)$/, async (ctx) => {
    const [title, text] = TECH[ctx.match[1]] || ['?', 'Невідома технологія'];
    await ctx.answerCallbackQuery();
    return ctx.reply(`🔹 ${title}\n\n${text}`);
  });

  bot.hears(BTN.contacts, (ctx) => {
    getSession(ctx.chat.id).aiMode = false;
    return ctx.reply(
      `📞 Контакти\n\nТелефон: ${STUDENT.phone}\nE-mail: ${STUDENT.email}\nTelegram: ${STUDENT.telegram}`,
    );
  });

  bot.hears(BTN.ai, (ctx) => {
    getSession(ctx.chat.id).aiMode = true;
    return ctx.reply(
      '🤖 Режим Prompt AI увімкнено.\nНапишіть своє запитання — я передам його AI.\n' +
      'Щоб вийти, оберіть інший пункт меню. /reset — почати нову розмову.',
    );
  });

  // Будь-який інший текст: у режимі AI — запит до моделі
  bot.on('message:text', async (ctx) => {
    const session = getSession(ctx.chat.id);
    if (!session.aiMode) {
      return ctx.reply(`Оберіть пункт меню. Щоб поставити питання AI, натисніть «${BTN.ai}».`,
        { reply_markup: mainMenu });
    }
    await ctx.replyWithChatAction('typing');
    session.history.push({ role: 'user', content: ctx.message.text });
    session.history = session.history.slice(-10); // зберігаємо останні 10 повідомлень
    try {
      const answer = await askAI(session.history);
      session.history.push({ role: 'assistant', content: answer });
      // Telegram обмежує повідомлення 4096 символами
      for (let i = 0; i < answer.length; i += 4000) await ctx.reply(answer.slice(i, i + 4000));
    } catch (err) {
      session.history.pop();
      console.error('AI error:', err.message);
      await ctx.reply('⚠️ Не вдалося отримати відповідь від AI. Спробуйте пізніше.');
    }
  });

  bot.catch((err) => console.error('Bot error:', err.error));
  return bot;
}

module.exports = { createBot, BTN };
