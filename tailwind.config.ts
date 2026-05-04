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
        // Dark surfaces
        bg:      '#09090b',
        'bg-2':  '#111113',
        'bg-3':  '#18181b',
        'bg-4':  '#1f1f23',
        border:  '#27272a',
        'border-2': '#3f3f46',
        // Text
        fg:      '#e4e4e7',
        'fg-2':  '#a1a1aa',
        'fg-3':  '#71717a',
        'fg-4':  '#52525b',
        // Accent (amber default)
        accent:  '#fbbf24',
        'accent-dark': '#d97706',
        'accent-muted': '#fcd34d',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
}
export default config
