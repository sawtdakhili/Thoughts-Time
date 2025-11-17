/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'background': '#0A0A0A',
        'text-primary': '#F5F5F5',
        'text-secondary': '#6A6A6A',
        'border-subtle': '#1A1A1A',
        'hover-bg': '#0F0F0F',
      },
      fontFamily: {
        'serif': ['"Crimson Text"', 'Lora', 'Georgia', '"Times New Roman"', 'serif'],
        'mono': ['"Courier Prime"', '"Courier New"', 'monospace'],
      },
      fontSize: {
        'xs': '14px',
        'sm': '15px',
        'base': '18px',
        'lg': '20px',
        'xl': '24px',
      },
      spacing: {
        '6': '6px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '48': '48px',
        '64': '64px',
      },
      lineHeight: {
        'book': '1.42',
      },
    },
  },
  plugins: [],
}
