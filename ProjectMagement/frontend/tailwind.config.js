/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', hover: '#3b82f6' },
      },
      screens: {
        xs: '380px',
      },
    },
  },
  plugins: [],
}
