import type { Config } from 'tailwindcss'

const cssVar = (name: string) => `var(${name})`

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './design/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: cssVar('--paper'),
          raised: cssVar('--paper-raised'),
          sunken: cssVar('--paper-sunken'),
          edge: cssVar('--paper-edge'),
        },
        ink: {
          DEFAULT: cssVar('--ink'),
          strong: cssVar('--ink-strong'),
          muted: cssVar('--ink-muted'),
          faint: cssVar('--ink-faint'),
        },
        accent: {
          DEFAULT: cssVar('--accent'),
          pressed: cssVar('--accent-pressed'),
          ink: cssVar('--accent-ink'),
          tint: cssVar('--accent-tint'),
        },
        'accent-2': {
          DEFAULT: cssVar('--accent-2'),
          tint: cssVar('--accent-2-tint'),
        },
        muted: {
          DEFAULT: cssVar('--muted'),
          ink: cssVar('--muted-ink'),
        },
        signal: {
          positive: cssVar('--signal-positive'),
          'positive-tint': cssVar('--signal-positive-tint'),
          warning: cssVar('--signal-warning'),
          'warning-tint': cssVar('--signal-warning-tint'),
        },
      },
      fontFamily: {
        serif: [cssVar('--font-serif')],
        sans: [cssVar('--font-sans')],
        mono: [cssVar('--font-mono')],
      },
      spacing: {
        '1': cssVar('--space-1'),
        '2': cssVar('--space-2'),
        '3': cssVar('--space-3'),
        '4': cssVar('--space-4'),
        '5': cssVar('--space-5'),
        '6': cssVar('--space-6'),
        '7': cssVar('--space-7'),
        '8': cssVar('--space-8'),
      },
      borderRadius: {
        none: cssVar('--radius-none'),
        sm: cssVar('--radius-sm'),
        md: cssVar('--radius-md'),
        lg: cssVar('--radius-lg'),
      },
      boxShadow: {
        resting: cssVar('--shadow-resting'),
        lifted: cssVar('--shadow-lifted'),
        dragging: cssVar('--shadow-dragging'),
      },
      transitionTimingFunction: {
        lift: cssVar('--ease-lift'),
        settle: cssVar('--ease-settle'),
        recede: cssVar('--ease-recede'),
      },
      transitionDuration: {
        lift: '120ms',
        settle: '240ms',
        recede: '400ms',
      },
      keyframes: {
        turnDot: {
          '0%, 80%, 100%': { opacity: '0.2' },
          '40%': { opacity: '0.9' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
      },
      animation: {
        turnDot: 'turnDot 1.2s ease-in-out infinite',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}

export default config
