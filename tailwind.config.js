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
          bg: '#050608',
          panel: '#0B0C12',
          card: '#10121A',
          cardHover: '#161924',
          cyan: '#00E5F2',
          magenta: '#FF007A',
          yellow: '#FFD000',
          emerald: '#10B981',
          border: '#1E2230',
          borderLight: '#2A3042',
          textMuted: '#94A3B8',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(0, 229, 242, 0.25)',
        'magenta-glow': '0 0 20px -3px rgba(255, 0, 122, 0.25)',
        'yellow-glow': '0 0 20px -3px rgba(255, 208, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
