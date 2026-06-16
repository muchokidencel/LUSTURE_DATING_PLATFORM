/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--bg-void)',
        base: 'var(--bg-base)',
        card: 'var(--bg-card)',
        'card-alt': 'var(--bg-card-alt)',
        elevated: 'var(--bg-elevated)',
        hover: 'var(--bg-hover)',
        border: { 
          DEFAULT: 'var(--border)', 
          subtle: 'var(--border-subtle)', 
          strong: 'var(--border-strong)' 
        },
        'surface-dim': 'var(--bg-card)',
        'surface-container': 'var(--bg-elevated)',
        'surface-container-high': 'var(--bg-hover)',
        'surface-container-low': 'var(--bg-card-alt)',
        'outline-variant': 'var(--border-strong)',
        lustre: {
          purple: 'var(--purple)',
          'purple-dim': 'var(--purple-dim)',
          rose: 'var(--rose)',
          'rose-dim': 'var(--rose-dim)',
          gold: 'var(--gold)',
          'gold-dim': 'var(--gold-dim)',
          text: 'var(--text-primary)',
          muted: 'var(--text-secondary)',
          faint: 'var(--text-muted)',
        }
      },
      fontFamily: {
        garamond: ['EB Garamond', 'serif'],
        sans: ['Be Vietnam Pro', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'var(--gradient-brand)',
        'gradient-gold': 'var(--gradient-gold)',
      },
    }
  },
  plugins: [],
}

