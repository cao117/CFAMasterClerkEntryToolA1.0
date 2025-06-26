/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cfaGold: '#C7B273', // CFA gold
        cfaBlack: '#000000', // CFA black
        cfaBrown: '#8B7355', // CFA brown
        cfaSecondary: '#C7B273', // CFA gold for focus states
        cfaPrimary: '#000000', // CFA black
        cfaAccent: '#8B7355', // CFA brown
        cfaDark: '#1a1a1a', // Dark gray
        cfaLight: '#f8f8f8', // Light gray
        cfaBorder: '#e0e0e0', // Light border
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      }
    },
  },
  plugins: [],
}

