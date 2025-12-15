import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'status-red': '#DC2626',
        'status-yellow': '#FBBF24',
        'status-green': '#10B981',
      },
      fontSize: {
        'body': '18px',
        'button': '24px',
        'title': '32px',
      },
    },
  },
  plugins: [],
}
export default config
