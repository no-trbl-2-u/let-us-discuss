import { ImageResponse } from 'next/og'
import { HERO_HEADLINE } from '@/components/site/landing-hero'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export const alt = HERO_HEADLINE

// Token-mirrored colors (oklch tokens don't render in
// ImageResponse; using sRGB equivalents at parity with
// design/tokens.css's intent).
const PAPER = '#f5f1e6'
const INK_STRONG = '#1a1411'
const INK_MUTED = '#736a63'
const ACCENT = '#a4391f'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: PAPER,
        padding: '72px',
        position: 'relative',
      }}
    >
      <span
        style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: INK_MUTED,
        }}
      >
        BOARDROOM
      </span>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '64px',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            color: INK_STRONG,
            maxWidth: '900px',
            display: 'flex',
          }}
        >
          {HERO_HEADLINE}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            background: ACCENT,
            display: 'flex',
          }}
        />
        <span
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '18px',
            color: INK_MUTED,
          }}
        >
          let-us-discuss-ai.vercel.app
        </span>
      </div>
    </div>,
    size,
  )
}
