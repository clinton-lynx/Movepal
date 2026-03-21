/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        'primary-dark': '#1E3A8A',
        'primary-light': '#DBEAFE',
        'primary-glow': '#60A5FA',
        heavy: '#EF4444',
        moderate: '#F97316',
        flowing: '#22C55E',
        'dark-bg': '#030816',
        'dark-surface': '#0A1628',
        'dark-surface-alt': '#0F2040',
        'dark-text': '#F1F5F9',
        'dark-muted': '#94A3B8',
        'light-bg': '#F8FAFC',
        'light-surface': '#FFFFFF',
        'light-surface-alt': '#EFF6FF',
        'light-text': '#030816',
        'light-muted': '#64748B',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};
