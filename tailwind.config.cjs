/** @type {import('tailwindcss').Config} */
module.exports = {
  // Class-based dark mode: we toggle `.dark` on <html> from the theme store.
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // All colors map to CSS variables (defined in globals.css) so dark/light
      // swap instantly with no Tailwind rebuild. Values are space-separated RGB
      // channels so we can apply Tailwind's opacity modifiers, e.g. bg-surface/60.
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        'bg-elevated': 'rgb(var(--bg-elevated) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        content: 'rgb(var(--content) / <alpha-value>)',
        'content-muted': 'rgb(var(--content-muted) / <alpha-value>)',
        'content-subtle': 'rgb(var(--content-subtle) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-2': 'rgb(var(--accent-2) / <alpha-value>)',
        violet: 'rgb(var(--violet) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)'
      },
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif'
        ],
        mono: ['SF Mono', 'JetBrains Mono', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px'
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(var(--accent) / 0.35), 0 0 28px -4px rgb(var(--accent) / 0.45)',
        card: '0 1px 2px rgb(0 0 0 / 0.20), 0 12px 32px -12px rgb(0 0 0 / 0.45)',
        'card-hover': '0 2px 4px rgb(0 0 0 / 0.25), 0 24px 48px -16px rgb(0 0 0 / 0.55)',
        inset: 'inset 0 1px 0 0 rgb(255 255 255 / 0.04)'
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, rgb(var(--accent)) 0%, rgb(var(--violet)) 100%)',
        'glass-sheen':
          'linear-gradient(135deg, rgb(255 255 255 / 0.08) 0%, rgb(255 255 255 / 0.02) 40%, transparent 100%)'
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite'
      }
    }
  },
  plugins: []
}
