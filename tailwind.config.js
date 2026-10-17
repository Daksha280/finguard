/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#101828',
          700: '#344054',
          500: '#667085',
          300: '#D0D5DD',
          100: '#F2F4F7',
        },
        brand: {
          700: '#1D4ED8',
          600: '#2563EB',
          500: '#3B6FE0',
          100: '#E8EFFD',
          50: '#F5F8FF',
        },
        risk: {
          high: '#DC2626',
          highBg: '#FEF2F2',
          medium: '#D97706',
          mediumBg: '#FFFBEB',
          low: '#16A34A',
          lowBg: '#F0FDF4',
        },
        surface: '#FFFFFF',
        page: '#F6F7F9',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(16, 24, 40, 0.06), 0 1px 3px 0 rgba(16, 24, 40, 0.08)',
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
