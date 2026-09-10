import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#0A0F1D',
        titanium: '#131C31',
        cyan: {
          accent: '#00F2FE',
        },
        contrast: '#F8FAFC',
        muted: '#8B96AC',
        border: '#1E2A44',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'cyan-glow': '0 0 24px 0 rgba(0, 242, 254, 0.25)',
      },
      backgroundImage: {
        'node-grid':
          'linear-gradient(rgba(0, 242, 254, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 254, 0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
    },
  },
  plugins: [],
}
export default config
