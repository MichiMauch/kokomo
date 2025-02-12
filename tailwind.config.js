/* eslint-disable @typescript-eslint/no-require-imports */
// @ts-check
/** @type {import("tailwindcss").Config } */
module.exports = {
  theme: {
    extend: {
      colors: {
        secondary: {
          50: '#E3F8FF',
          100: '#B3ECFF',
          200: '#80DEFF',
          300: '#4DD1FF',
          400: '#26C7FF',
          500: '#01ABE7', // Basisfarbe
          600: '#0192C8',
          700: '#0176A9',
          800: '#015D8B',
          900: '#01466F',
          950: '#012D55',
        },
        primary: {
          50: '#E3F9ED',
          100: '#C1F2E0',
          200: '#88E6C7',
          300: '#4DDAB0',
          400: '#26D39F',
          500: '#05DE66', // Basisfarbe
          600: '#04C95C',
          700: '#03B352',
          800: '#029B48',
          900: '#018D3F',
          950: '#017734',
        },
        'brand-blue': '#01ABE7',
        'brand-blue-light': '#2CC7FF',
        'brand-green': '#05DE66',
        'brand-green-dark': '#14A54D',
        'brand-brown': '#E9BA6B',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('--color-primary-500'),
              '&:hover': {
                color: theme('--color-primary-600'),
              },
              code: { color: theme('--color-primary-400') },
            },
            'h1,h2': {
              fontWeight: '700',
              letterSpacing: theme('--tracking-tight'),
            },
            h3: {
              fontWeight: '600',
            },
            code: {
              color: theme('--color-indigo-500'),
            },
          },
        },
        invert: {
          css: {
            a: {
              color: theme('--color-pink-500'),
              '&:hover': {
                color: theme('--color-primary-400'),
              },
              code: { color: theme('--color-primary-400') },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('--color-gray-100'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
