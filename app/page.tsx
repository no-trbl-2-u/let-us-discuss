import { Suspense } from 'react'
import { LandingDeletedBanner } from '@/components/site/landing-deleted-banner'
import { LandingHero } from '@/components/site/landing-hero'

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <LandingDeletedBanner />
      </Suspense>
      <LandingHero />
    </>
  )
}
