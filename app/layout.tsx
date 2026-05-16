import type { Metadata } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import { Header } from '@/components/site/header'
import { Footer } from '@/components/site/footer'
import './globals.css'

const sans = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans-loaded',
})

const serif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif-loaded',
})

export const metadata: Metadata = {
  title: 'boardroom — pitch to spec, via a short board-room conversation',
  description:
    'Drag-and-drop a few AI personas, give them a loose pitch, and walk out with a concrete spec — no prompt engineering required.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-paper text-ink antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
