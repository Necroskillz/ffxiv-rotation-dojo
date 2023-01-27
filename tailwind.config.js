/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'xiv-bg': '#545561',
        'xiv-gold': '#ad925a',
        'xiv-golden-brown': '#A49F8C',
        'xiv-orange': '#EE7318',
        'xiv-ui': '#E8E1CE',
        'pull-timer': '#D4A900'
      },
    },
    fontFamily: {
      'ui-light': ['Miedinger Light W00 Regular'],
      'ui-medium': ['Miedinger Medium W00 Regular'],
    },
  },
  plugins: [],
};
