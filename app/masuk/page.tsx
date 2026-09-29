import type { Metadata } from 'next'
import Auth from '@/src/components/Auth'

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke akun Daily Tracker kamu.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/masuk' },
}

export default function MasukPage() {
  return <Auth />
}
