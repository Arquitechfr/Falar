/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C66B4A',
        primaryDark: '#A85638',
        primaryLight: '#E08866',
        background: '#1A1410',
        surface: '#2A2018',
        surfaceLight: '#3A2E24',
        bubbleMine: '#C66B4A',
        bubbleOther: '#2A2018',
        textPrimary: '#F5EDE6',
        textSecondary: '#A89684',
        statusRead: '#7CB9E8',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
