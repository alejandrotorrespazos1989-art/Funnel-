import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f1417',
        surface: '#f7f5f1',
        gold: '#c9a24a',
        petrol: '#1f3a44',
        mint: '#8fc7b6',
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Inter', 'sans-serif'],
        display: ['ui-serif', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
