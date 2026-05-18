import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const ACCENT = '#a4391f'
const ACCENT_INK = '#f5f1e6'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: ACCENT,
        color: ACCENT_INK,
        fontFamily: 'Georgia, serif',
        fontWeight: 700,
        fontSize: '128px',
        fontStyle: 'italic',
      }}
    >
      b
    </div>,
    size,
  )
}
