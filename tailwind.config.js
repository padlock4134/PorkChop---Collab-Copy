module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        maineBlue: '#2a4d69',
        seafoam: '#63ace5',
        sand: '#f5e9da',
        lobsterRed: '#e94e3c',
        navy: '#24344d',
        weatheredWhite: '#f9fafb',
      },
      fontFamily: {
        retro: ['"Bree Serif"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
