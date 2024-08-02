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
        'xiv-offensive': '#F8D5BB',
        'xiv-dot': '#CB7870',
        'xiv-heal': '#C6D4BB',
        'pull-timer': '#D4A900',
      },
      dropShadow: {
        'blue': '0 0 10px rgba(0,0,255,1)'
      }
    },
    fontFamily: {
      'ui-light': ['Miedinger Light W00 Regular'],
      'ui-medium': ['Miedinger Medium W00 Regular'],
    },
  },
  plugins: [],
};
