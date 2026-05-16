import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google'
import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'
import './globals.css'

const serif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif-loaded',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-loaded',
  weight: ['400', '500', '600'],
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-loaded',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'boardroom — a short, opinionated meeting with AI personas',
  description:
    'Drop a few personas onto the table, hand them your pitch, and let them confer. You answer one-word questions at the checkpoints. They do the thinking.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      style={
        {
          // Map the next/font CSS variables onto the design-system token
          // family fallbacks declared in design/tokens.css.
          '--font-serif': `var(--font-serif-loaded), "Source Serif 4", Charter, "Iowan Old Style", Georgia, serif`,
          '--font-sans': `var(--font-sans-loaded), "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif`,
          '--font-mono': `var(--font-mono-loaded), "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace`,
        } as React.CSSProperties
      }
    >
      <body className="min-h-screen antialiased flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
