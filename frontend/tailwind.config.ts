import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF6B35',
          yellow: '#FFD166',
          green: '#06D6A0',
          blue: '#118AB2',
          dark: '#073B4C',
        },
        wkl: {
          primary: '#9d4300',
          'primary-container': '#f97316',
          'on-primary': '#ffffff',
          'on-primary-container': '#ffffff',
          secondary: '#0058be',
          'secondary-container': '#2170e4',
          'on-secondary-container': '#fefcff',
          'secondary-fixed': '#d8e2ff',
          'tertiary-container': '#c19300',
          'tertiary-fixed': '#ffdf9a',
          'tertiary-fixed-dim': '#f7be1d',
          surface: '#f9f9ff',
          'surface-lowest': '#ffffff',
          'surface-low': '#f0f3ff',
          'surface-container': '#e7eefe',
          'surface-high': '#e2e8f8',
          'surface-highest': '#dce2f3',
          'surface-variant': '#dce2f3',
          'surface-dim': '#d3daea',
          'outline': '#8c7164',
          'outline-variant': '#e0c0b1',
          'on-surface': '#151c27',
          'on-surface-variant': '#584237',
          'on-background': '#151c27',
          background: '#f9f9ff',
          error: '#ba1a1a',
          'on-error': '#ffffff',
          'error-container': '#ffdad6',
          'primary-fixed': '#ffdbca',
          'primary-fixed-dim': '#ffb690',
          'inverse-surface': '#2a313d',
          'on-inverse': '#ebf1ff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        nunito: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'bounce-in': 'bounce-in 0.4s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
