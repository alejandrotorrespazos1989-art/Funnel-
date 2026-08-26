import { env } from './env';

const TG = 'https://api.telegram.org/bot';

export async function tgSend(chatId: string | number, text: string, opts: Record<string, unknown> = {}) {
  const token = env.telegramToken();
  if (!token) return;
  await fetch(`${TG}${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...opts }),
  }).catch(() => {});
}

export async function notifyAdminTelegram(text: string) {
  const chatId = env.telegramAdminChat();
  if (!chatId) return;
  await tgSend(chatId, text);
}
