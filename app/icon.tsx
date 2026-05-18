import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

const ACCENT = '#a4391f'
const ACCENT_INK = '#f5f1e6'

export default function Icon() {
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
        fontSize: '24px',
        fontStyle: 'italic',
      }}
    >
      b
    </div>,
    size,
  )
}
