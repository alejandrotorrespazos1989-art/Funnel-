function need(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Falta variable de entorno: ${key}`);
  return v;
}

export const env = {
  supabaseUrl: () => need('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => need('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRole: () => need('SUPABASE_SERVICE_ROLE_KEY'),
  appUrl: () => process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  adminEmail: () => need('ADMIN_EMAIL'),
  telegramToken: () => process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramSecret: () => process.env.TELEGRAM_WEBHOOK_SECRET ?? '',
  telegramAdminChat: () => process.env.TELEGRAM_ADMIN_CHAT_ID ?? '',
  holdedKey: () => process.env.HOLDED_API_KEY ?? '',
  holdedProductId: () => process.env.HOLDED_DEFAULT_PRODUCT_ID ?? '',
};
