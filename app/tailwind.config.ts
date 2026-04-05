import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        carbon:      '#414040',
        dark2:       '#333231',
        'gray-stone':'#7F7F7D',
        arena:       '#A4A4A4',
        cream:       '#E9E4DB',
        'cream-bg':  '#F0ECE5',
      },
      fontFamily: {
        jost: ['Jost Variable', 'Jost', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
