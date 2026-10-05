// Запит до безкоштовного AI (Groq API, OpenAI-сумісний інтерфейс)
const { GROQ_API_KEY, GROQ_MODEL } = require('./config');

const SYSTEM_PROMPT =
  'Ти корисний асистент у Telegram-боті студента. Відповідай українською мовою, ' +
  'коротко та по суті (до 1500 символів). Не використовуй Markdown-таблиці.';

async function askAI(history) {
  if (!GROQ_API_KEY) throw new Error('Не задано GROQ_API_KEY');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || 'AI не повернув відповіді';
}

module.exports = { askAI };
