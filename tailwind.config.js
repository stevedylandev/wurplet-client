/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "DM Sans",
          ...defaultTheme.fontFamily.sans
        ]
      },

      colors: {
        main: 'var(--main)',
        overlay: 'var(--overlay)',
        bg: 'var(--bg)',
        bw: 'var(--bw)',
        blank: 'var(--blank)',
        text: 'var(--text)',
        mtext: 'var(--mtext)',
        border: 'var(--border)',
        ring: 'var(--ring)',
        ringOffset: 'var(--ring-offset)',
        secondaryBlack: '#212121'
      },
      borderRadius: {
        base: '5px'
      },
      boxShadow: {
        shadow: 'var(--shadow)'
      },
      translate: {
        boxShadowX: '4px',
        boxShadowY: '4px',
        reverseBoxShadowX: '-4px',
        reverseBoxShadowY: '-4px'
      },
      fontWeight: {
        base: '500',
        heading: '700'
      },
      animation: {
        marquee: 'marquee 5s linear infinite',
        marquee2: 'marquee2 5s linear infinite'
      },
      keyframes: {
        marquee: {
          '0%': {
            transform: 'translateX(0%)'
          },
          '100%': {
            transform: 'translateX(-100%)'
          }
        },
        marquee2: {
          '0%': {
            transform: 'translateX(100%)'
          },
          '100%': {
            transform: 'translateX(0%)'
          }
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
}
