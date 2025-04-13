/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/ArticlePage.tsx",
    "./src/pages/WisdomMinimalLanding.tsx",
    "./src/components/StatsPanel.tsx",
    "./src/components/AudioPlayer.tsx",
    "./src/App.tsx",
    "./src/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'cormorant': ['"Cormorant Garamond"', 'serif'],
        'baskerville': ['"Libre Baskerville"', 'serif'],
        'lora': ['Lora', 'serif'],
        'serif': ['"Playfair Display"', '"Libre Baskerville"', 'Georgia', 'serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'monospace'],
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e5edff',
          200: '#cddbfe',
          300: '#b4c6fc',
          400: '#8da2fb',
          500: '#6875f5',
          600: '#5850ec',
          700: '#5145cd',
          800: '#42389d',
          900: '#362f78',
        },
      },
    },
  },
  plugins: [],
} 