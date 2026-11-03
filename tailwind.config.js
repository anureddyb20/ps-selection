/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ops: {
          bg: '#000000',
          panel: '#080808',
          card: '#0d0d0f',
          cardHover: '#141417',
          cyan: '#FF007F', // Aliased to primary magenta accent to maintain theme harmony
          magenta: '#FF007F',
          magentaHover: '#ff1a8c',
          yellow: '#FF007F', // Aliased to magenta accent for bold focused palette
          emerald: '#10B981',
          border: '#1f1f23',
          borderLight: '#2e2e34',
          textMuted: '#9ca3af',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'cyan-glow': '0 0 25px -2px rgba(255, 0, 127, 0.35)',
        'magenta-glow': '0 0 25px -2px rgba(255, 0, 127, 0.4)',
        'yellow-glow': '0 0 25px -2px rgba(255, 0, 127, 0.35)',
      },
    },
  },
  plugins: [],
};
