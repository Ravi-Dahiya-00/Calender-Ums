/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        lpu: {
          maroon:  '#8B0000',
          mid:     '#A31515',
          lt:      '#C41E3A',
          gold:    '#C9A84C',
          'gold-lt': '#E8C96D',
        },
      },
    },
  },
  plugins: [],
}
