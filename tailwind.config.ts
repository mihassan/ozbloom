import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F9F6F0',
        sand: '#EBE4D8',
        eucalyptus: '#5B7B61',
        wattle: '#D4B85C',
        forest: '#2C3D30',
        muted: '#68766B',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(44, 61, 48, 0.08)',
        'card-lg': '0 8px 40px rgba(44, 61, 48, 0.12)',
      },
      minHeight: {
        screen: '100dvh',
      },
    },
  },
  plugins: [],
} satisfies Config
