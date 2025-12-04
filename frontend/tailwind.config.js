/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'accent-1': '#8b5cf6',
        'accent-2': '#a855f7',
        'accent-3': '#0ea5e9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        'glow-1': '0 0 20px rgba(139, 92, 246, 0.6)',
        'glow-2': '0 0 30px rgba(14, 165, 233, 0.5)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-blue': '0 0 30px rgba(14, 165, 233, 0.4)',
      },
      backgroundImage: {
        'gradient-main': 'radial-gradient(circle at 50% 20%, #14061f, #09050e, #04030a)',
        'gradient-accent': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #0ea5e9 100%)',
      },
    },
  },
  plugins: [],
};
