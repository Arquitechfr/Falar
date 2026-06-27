/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C96B4A',
        primaryLight: '#D98969',
        primaryDark: '#A85337',
        background: '#FAF7F5',
        card: '#FFFFFF',
        secondaryBackground: '#F2ECE8',
        border: '#E9DFDA',
        success: '#3FBF75',
        danger: '#E55252',
        warning: '#F2A541',
        textPrimary: '#1F1F1F',
        textSecondary: '#7B7B7B',
        bubbleMine: '#C96B4A',
        bubbleOther: '#F2ECE8',
        statusRead: '#C96B4A',
        surface: '#FFFFFF',
        surfaceLight: '#F2ECE8',
        overlay: 'rgba(0,0,0,0.4)',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
      },
      boxShadow: {
        sm: { shadowColor: '#1F1F1F', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
        md: { shadowColor: '#1F1F1F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
        lg: { shadowColor: '#1F1F1F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 5 },
        fab: { shadowColor: '#C96B4A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
      },
    },
  },
  plugins: [],
};
