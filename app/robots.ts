import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Private, user-specific pages have nothing useful for a crawler.
      disallow: ['/dashboard', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
