import type { MetadataRoute } from 'next'
import { getSiteOrigin } from '@/lib/site/origin'
import { PUBLIC_INDEXABLE_PATHS } from '@/lib/site/public-urls'

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin()
  return PUBLIC_INDEXABLE_PATHS.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1.0 : 0.7,
  }))
}
