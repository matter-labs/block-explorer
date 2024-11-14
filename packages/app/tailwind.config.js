const colors = require('tailwindcss/colors');
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./src/**/*.{html,js,ts,vue}'],
  theme: {
    container: false,
    extend: {
      fontFamily: {
        sans: ['Geist', ...defaultTheme.fontFamily.sans],
        mono: ['Geist Mono', ...defaultTheme.fontFamily.mono],
      },
      colors: {
        primary: {
          50: '#E5E7EB',
          100: '#D1D5DB',
          200: '#9CA3AF',
          300: '#6B7280',
          400: '#4B5563',
          500: '#374151',
          600: '#1F2937',
          700: '#111827',
          800: '#0A0F1A',
          900: '#050813',
        },
        secondary: colors.yellow,
        neutral: colors.gray,

        success: colors.green,
        error: colors.red,
        warning: colors.yellow,
      },
      screens: {
        xs: '480px',
        '4xl': '1920px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function ({ addComponents }) {
      addComponents({
        '.container': {
          maxWidth: '90%',
          marginLeft: 'auto',
          marginRight: 'auto',
          '@screen xl': {
            maxWidth: '1240px',
          },
        },
      });
    },
  ],
};
